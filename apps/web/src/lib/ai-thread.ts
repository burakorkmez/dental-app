import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { aiConversations } from '@/db/schema';

import { notFound } from './http';

/**
 * The one place a conversation id is turned back into a row, so the ownership
 * check (`userId = me`) exists once rather than in every route that appends to a
 * thread. A id that belongs to someone else is a 404, not a 403 — a 403 would
 * confirm the conversation exists.
 */
export async function getOrCreateConversation(userId: string, conversationId?: string) {
  if (!conversationId) {
    const [created] = await db.insert(aiConversations).values({ userId }).returning();
    return created;
  }

  const [found] = await db
    .select()
    .from(aiConversations)
    .where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, userId)));
  if (!found) throw notFound('Conversation not found');
  return found;
}
