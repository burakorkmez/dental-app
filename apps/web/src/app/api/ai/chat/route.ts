import * as Sentry from '@sentry/nextjs';
import { asc, desc, eq } from 'drizzle-orm';
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
import { getOrCreateConversation } from '@/lib/ai-thread';
import { requireAuth } from '@/lib/auth';
import { imagekit, photoFolder, signedPhoto } from '@/lib/imagekit';
import { ApiError, json, route } from '@/lib/http';
import { aiChatSchema } from '@/lib/validation';

/**
 * Education and triage only. The thread persists so it survives an app restart.
 *
 * What is sent to OpenAI: the system prompt and this conversation's messages.
 * Nothing else — no record is ever attached. But the messages are patient-typed
 * free text, so they may still carry identifiers; see lib/ai.ts. The outbound
 * call is gated on an explicit deployment approval and fails closed.
 *
 * That same free text does NOT go to Sentry: `genAI: { inputs: false, outputs:
 * false }` in sentry.server.config.ts keeps the prompt and the reply off the
 * gen_ai span, so Conversations lists the thread and its turns but replays no
 * message content. Tokens, cost, latency, model and errors all survive that.
 * Flip the two flags to true only if PLAN.md A15 (seeded fake patients) is
 * still what is running — a real patient's symptoms are PHI.
 */
export const POST = route(async (req: Request) => {
  const user = await requireAuth();
  const body = aiChatSchema.parse(await req.json());

  const conversation = await getOrCreateConversation(user.id, body.conversationId);

  // Agent tracing. Both are scoped to this request, and both have to be set
  // before the model call below or the span is orphaned.
  //
  // The thread id doubles as the conversation id, so every turn of one chat
  // lands in a single Sentry conversation across separate requests and traces.
  // The user is id-only on purpose: a patient's email is an identifier, and
  // the User column only needs something stable to group by.
  Sentry.setUser({ id: user.id });
  Sentry.setConversationId(conversation.id);

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

  const history = (
    await db
      .select({ role: aiMessages.role, content: aiMessages.content })
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conversation.id))
      .orderBy(asc(aiMessages.createdAt))
      .limit(30)
    // A photo turn is stored with empty content — the image never goes to
    // OpenAI, and a blank turn in the prompt is worse than no turn at all.
  ).filter((m) => m.content.trim());

  // The wrapper is what produces the gen_ai span — model, tokens, cost and
  // latency. Not the prompt or the reply; see the PHI note at the top.
  //
  // ponytail: `openai@7` is past the range Sentry documents as supported
  // (>=4 <7); the wrapper only touches `chat.completions.create`, which has
  // not changed, and spans were verified landing. Recheck on an openai major.
  const openai = Sentry.instrumentOpenAiClient(
    new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  );
  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content }) as const),
    ],
    max_tokens: 400,
    temperature: 0.3,
    stream: true,
    // OpenAI omits token counts from streamed responses unless asked. Without
    // this the gen_ai span has no usage, and so no cost estimate.
    stream_options: { include_usage: true },
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
      // Signed fresh on every read rather than stored: a delivery URL for a
      // private file expires, so a persisted one would be a dead link.
      image: m.imagePath ? signedPhoto(m.imagePath) : null,
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

/** Clears the patient's history. The messages go with it — `on delete cascade`. */
export const DELETE = route(async () => {
  const user = await requireAuth();
  await db.delete(aiConversations).where(eq(aiConversations.userId, user.id));

  // Dropping the rows would otherwise leave the photos themselves sitting in
  // ImageKit with nothing left pointing at them — deleted to the patient,
  // retained by us. One folder per user is what makes this a single call.
  //
  // Best-effort on purpose: the rows are already gone, and failing the request
  // now would tell the patient the delete did not happen when most of it did.
  try {
    await imagekit().deleteFolder(photoFolder(user.id));
  } catch (err) {
    // 404 is the normal case — a patient who never attached a photo has no
    // folder. Anything else is a real orphan worth knowing about.
    console.error('[ai] photo folder cleanup failed', err instanceof Error ? err.message : err);
  }

  return json({ ok: true });
});
