import { and, asc, desc, eq } from 'drizzle-orm';
import OpenAI from 'openai';

import { db } from '@/db';
import { aiConversations, aiMessages } from '@/db/schema';
import {
  AI_MODEL,
  EMERGENCY_REPLY,
  externalTransmissionApproved,
  isEmergency,
  replyStream,
  SYSTEM_PROMPT,
} from '@/lib/ai';
import { requireAuth } from '@/lib/auth';
import { ApiError, json, notFound, route } from '@/lib/http';
import { aiChatSchema } from '@/lib/validation';

/**
 * Education and triage only. The thread persists so it survives an app restart.
 *
 * What is sent to OpenAI: the system prompt and this conversation's messages.
 * Nothing else — no record is ever attached. But the messages are patient-typed
 * free text, so they may still carry identifiers; see lib/ai.ts. The outbound
 * call is gated on an explicit deployment approval and fails closed.
 */
export const POST = route(async (req: Request) => {
  const user = await requireAuth();
  const body = aiChatSchema.parse(await req.json());

  const conversation = body.conversationId
    ? (
        await db
          .select()
          .from(aiConversations)
          .where(
            and(eq(aiConversations.id, body.conversationId), eq(aiConversations.userId, user.id))
          )
      )[0]
    : (await db.insert(aiConversations).values({ userId: user.id }).returning())[0];

  if (!conversation) throw notFound('Conversation not found');

  await db.insert(aiMessages).values({
    conversationId: conversation.id,
    role: 'user',
    content: body.message,
  });

  // The emergency path short-circuits BEFORE the model and must never depend
  // on it. Same words every time.
  if (isEmergency(body.message)) {
    const [saved] = await db
      .insert(aiMessages)
      .values({ conversationId: conversation.id, role: 'assistant', content: EMERGENCY_REPLY })
      .returning();

    return json({
      conversationId: conversation.id,
      emergency: true,
      message: { id: saved.id, role: 'assistant', content: EMERGENCY_REPLY },
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new ApiError(503, 'The assistant is not configured yet.', 'ai_unconfigured');
  }

  // Everything above this line stays local — the emergency card in particular,
  // which must keep working even when the model is unreachable. Past this point
  // patient-typed text leaves our boundary, so it needs explicit approval.
  if (!externalTransmissionApproved()) {
    throw new ApiError(
      503,
      'The assistant is unavailable in this environment.',
      'ai_transmission_blocked'
    );
  }

  const history = await db
    .select({ role: aiMessages.role, content: aiMessages.content })
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, conversation.id))
    .orderBy(asc(aiMessages.createdAt))
    .limit(30);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content }) as const),
    ],
    max_tokens: 400,
    temperature: 0.3,
    stream: true,
  });

  // The answer streams as it is generated. Every branch above this line stays
  // JSON — emergencies and the 503s — so the client can tell the two apart by
  // content type, and the conversation id rides in a header because a text
  // body has nowhere to put it.
  const stream = replyStream(completion, (reply) =>
    db
      .insert(aiMessages)
      .values({ conversationId: conversation.id, role: 'assistant', content: reply })
  );

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Conversation-Id': conversation.id,
    },
  });
});

/** Rehydrates the thread when the app restarts. One thread per patient: the newest. */
export const GET = route(async () => {
  const user = await requireAuth();

  const [conversation] = await db
    .select()
    .from(aiConversations)
    .where(eq(aiConversations.userId, user.id))
    .orderBy(desc(aiConversations.createdAt))
    .limit(1);
  if (!conversation) return json({ conversationId: null, messages: [] });

  const messages = await db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, conversation.id))
    .orderBy(asc(aiMessages.createdAt));

  return json({
    conversationId: conversation.id,
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

/** Clears the patient's history. The messages go with it — `on delete cascade`. */
export const DELETE = route(async () => {
  const user = await requireAuth();
  await db.delete(aiConversations).where(eq(aiConversations.userId, user.id));
  return json({ ok: true });
});
