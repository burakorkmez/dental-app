import { and, asc, eq } from 'drizzle-orm';
import OpenAI from 'openai';

import { db } from '@/db';
import { aiConversations, aiMessages } from '@/db/schema';
import { AI_MODEL, EMERGENCY_REPLY, isEmergency, SYSTEM_PROMPT } from '@/lib/ai';
import { requireAuth } from '@/lib/auth';
import { ApiError, json, notFound, route } from '@/lib/http';
import { aiChatSchema } from '@/lib/validation';

/**
 * Education and triage only. The thread persists so it survives an app restart.
 *
 * What is sent to OpenAI: the system prompt and this conversation's messages.
 * Nothing else. No name, no DOB, no medical history, no appointments.
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
  });

  const reply =
    completion.choices[0]?.message?.content?.trim() ??
    'Sorry, I could not answer that. Would you like to book an appointment instead?';

  const [saved] = await db
    .insert(aiMessages)
    .values({ conversationId: conversation.id, role: 'assistant', content: reply })
    .returning();

  return json({
    conversationId: conversation.id,
    emergency: false,
    message: { id: saved.id, role: 'assistant', content: reply },
  });
});

/** Rehydrates a thread when the app restarts. */
export const GET = route(async (req: Request) => {
  const user = await requireAuth();
  const conversationId = new URL(req.url).searchParams.get('conversationId');
  if (!conversationId) return json({ conversationId: null, messages: [] });

  const [conversation] = await db
    .select()
    .from(aiConversations)
    .where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, user.id)));
  if (!conversation) throw notFound('Conversation not found');

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
