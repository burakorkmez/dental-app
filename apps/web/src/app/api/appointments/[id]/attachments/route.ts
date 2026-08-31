import { and, count, eq } from 'drizzle-orm';

import { db } from '@/db';
import { appointmentAttachments, appointments, patients } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { badRequest, json, notFound, route } from '@/lib/http';
import { attachmentFolder, signedAttachment, uploadPrivateImage } from '@/lib/imagekit';

type Ctx = { params: Promise<{ id: string }> };

/**
 * An X-ray, prescription or referral letter the patient attaches to a booking.
 *
 * Uploaded after the appointment exists, one request per file, so there is no
 * window where a stored file belongs to nothing and no client-supplied storage
 * path for the server to have to trust.
 */
const MAX_PER_APPOINTMENT = 10;

export const POST = route(async (req: Request, ctx: Ctx) => {
  const user = await requireAuth();
  const appointmentId = (await ctx.params).id;

  // Ownership is the whole authorisation: an appointment belonging to one of
  // the caller's own patients, or a 404 that does not confirm it exists.
  const [owned] = await db
    .select({ id: appointments.id })
    .from(appointments)
    .innerJoin(patients, eq(patients.id, appointments.patientId))
    .where(and(eq(appointments.id, appointmentId), eq(patients.accountUserId, user.id)));
  if (!owned) throw notFound('Appointment not found');

  const [{ value: existing }] = await db
    .select({ value: count() })
    .from(appointmentAttachments)
    .where(eq(appointmentAttachments.appointmentId, owned.id));
  if (existing >= MAX_PER_APPOINTMENT) {
    throw badRequest(`You can attach up to ${MAX_PER_APPOINTMENT} images.`);
  }

  const form = await req.formData().catch(() => null);
  const path = await uploadPrivateImage(form?.get('photo'), attachmentFolder(user.id));

  const [created] = await db
    .insert(appointmentAttachments)
    .values({ appointmentId: owned.id, path })
    .returning();

  return json({ attachment: { id: created.id, ...signedAttachment(path) } }, 201);
});
