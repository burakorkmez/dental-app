import { db } from '@/db';
import { auditLog } from '@/db/schema';

/**
 * HIPAA posture: every staff read or write of a patient record or medical
 * history leaves a row here. Never log the values themselves — the entity id is
 * the whole point, the content is the thing we are protecting.
 */
export async function audit(
  actorUserId: string | null,
  action: 'read' | 'create' | 'update' | 'delete',
  entity: 'patients' | 'medical_histories' | 'appointments' | 'visit_notes',
  entityId: string | null
) {
  await db.insert(auditLog).values({ actorUserId, action, entity, entityId });
}
