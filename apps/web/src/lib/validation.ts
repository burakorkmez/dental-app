import { z } from 'zod';

/** MM/DD/YYYY (what the mobile onboarding field collects) or YYYY-MM-DD. */
const dateOfBirth = z
  .string()
  .trim()
  .refine((v) => /^\d{2}\s*\/\s*\d{2}\s*\/\s*\d{4}$/.test(v) || /^\d{4}-\d{2}-\d{2}$/.test(v), {
    message: 'Expected MM/DD/YYYY',
  })
  .transform((v) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const [mm, dd, yyyy] = v.split('/').map((s) => s.trim());
    return `${yyyy}-${mm}-${dd}`;
  })
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Not a real date' });

export const patientProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  dateOfBirth: dateOfBirth.optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  gender: z.string().trim().max(40).optional().nullable(),
  primaryConcern: z.string().trim().max(120).optional().nullable(),
  referralSource: z.string().trim().max(120).optional().nullable(),
});

export const createPatientSchema = patientProfileSchema.extend({
  /** Only the onboarding call sets this; dependents are always false. */
  isSelf: z.boolean().default(false),
});

export const medicalHistorySchema = z.object({
  allergies: z.array(z.string().trim().max(80)).max(50).default([]),
  medications: z.array(z.string().trim().max(80)).max(50).default([]),
  conditions: z.array(z.string().trim().max(80)).max(50).default([]),
  isSmoker: z.boolean().default(false),
  isPregnant: z.boolean().default(false),
  anxietyLevel: z.number().int().min(0).max(10).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const availabilityQuerySchema = z.object({
  serviceId: z.string().uuid(),
  dentistId: z.string().uuid().optional(),
  from: isoDay,
  to: isoDay.optional(),
});

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  serviceId: z.string().uuid(),
  dentistId: z.string().uuid(),
  /** The client never sends a duration — the server derives ends_at. */
  startsAt: z.string().datetime({ offset: true }),
});

export const patchAppointmentSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('cancel') }),
  z.object({
    action: z.literal('reschedule'),
    startsAt: z.string().datetime({ offset: true }),
    dentistId: z.string().uuid().optional(),
  }),
]);

export const aiChatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(2000),
});

export const visitNoteSchema = z.object({
  appointmentId: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
});
