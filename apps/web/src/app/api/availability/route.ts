import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { dentistServices, dentists, services } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { loadSchedulingInputs } from '@/lib/booking';
import { json, notFound, route } from '@/lib/http';
import { availableSlots } from '@/lib/scheduling';
import { formatClinicTime, parseDay } from '@/lib/time';
import { availabilityQuerySchema } from '@/lib/validation';

/**
 * GET /api/availability?serviceId=&from=YYYY-MM-DD[&to=][&dentistId=]
 *
 * Slots are aggregated across every dentist who offers the service, because the
 * mobile booking flow picks a time first and does not ask for a dentist. Each
 * slot carries the dentistId that POST /api/appointments needs back.
 */
export const GET = route(async (req: Request) => {
  await requireAuth();

  const url = new URL(req.url);
  const query = availabilityQuerySchema.parse({
    serviceId: url.searchParams.get('serviceId') ?? undefined,
    dentistId: url.searchParams.get('dentistId') ?? undefined,
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
  });

  const [service] = await db.select().from(services).where(eq(services.id, query.serviceId));
  if (!service || !service.isActive) throw notFound('Service not found');

  const from = parseDay(query.from);
  const to = parseDay(query.to ?? query.from);

  // Which dentists are in play.
  const offering = await db
    .select({ dentistId: dentistServices.dentistId })
    .from(dentistServices)
    .innerJoin(dentists, eq(dentists.id, dentistServices.dentistId))
    .where(
      and(
        eq(dentistServices.serviceId, service.id),
        eq(dentists.isActive, true),
        query.dentistId ? eq(dentists.id, query.dentistId) : undefined
      )
    );

  const dentistIds = offering.map((d) => d.dentistId);
  if (dentistIds.length === 0) return json({ service, slots: [] });

  const { workingHours: hours, busy } = await loadSchedulingInputs(dentistIds, from, to);

  const slots = availableSlots({
    workingHours: hours,
    busy,
    durationMinutes: service.durationMinutes,
    from,
    to,
    now: new Date(),
  });

  return json({
    service: { id: service.id, name: service.name, durationMinutes: service.durationMinutes },
    slots: slots.map((s) => ({
      dentistId: s.dentistId,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      // Clinic-local label so the app never has to know CLINIC_TZ.
      label: formatClinicTime(s.startsAt),
    })),
  });
});
