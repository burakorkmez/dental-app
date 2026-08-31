import { db } from '@/db';
import { aiMessages } from '@/db/schema';
import { PHOTO_REPLY } from '@/lib/ai';
import { getOrCreateConversation } from '@/lib/ai-thread';
import { requireAuth } from '@/lib/auth';
import { photoFolder, signedPhoto, uploadPrivateImage } from '@/lib/imagekit';
import { json, route } from '@/lib/http';

/**
 * A photo the patient attaches to the assistant thread.
 *
 * THE PHOTO IS NEVER SENT TO OPENAI. It is stored and rendered in the thread;
 * the reply is the hard-coded `PHOTO_REPLY`, decided here, with no model call —
 * the same shape as the emergency card in ../chat/route.ts. A photo message is
 * therefore a complete turn on its own, which is why this endpoint writes both
 * rows and why nothing about it streams.
 */

export const POST = route(async (req: Request) => {
  const user = await requireAuth();

  const form = await req.formData().catch(() => null);
  const path = await uploadPrivateImage(form?.get('photo'), photoFolder(user.id));

  const conversationId = form?.get('conversationId');
  const conversation = await getOrCreateConversation(
    user.id,
    typeof conversationId === 'string' && conversationId ? conversationId : undefined
  );

  // Empty content on purpose: it is the column the model reads as the patient's
  // turn, and there is no text here. ../chat/route.ts drops blank turns from the
  // history it sends, so the photo leaves no hole in the prompt.
  await db.insert(aiMessages).values([
    { conversationId: conversation.id, role: 'user', content: '', imagePath: path },
    { conversationId: conversation.id, role: 'assistant', content: PHOTO_REPLY },
  ]);

  return json({
    conversationId: conversation.id,
    image: signedPhoto(path),
    reply: PHOTO_REPLY,
  });
});
