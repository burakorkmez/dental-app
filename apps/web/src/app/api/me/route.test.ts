import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The one thing worth pinning about account deletion is the ORDER, because
 * getting it wrong is silent: every step still "works", and the damage only
 * shows up as PHI nobody can reach.
 *
 * Clerk must go last. While the Clerk user exists the patient is still signed
 * in and can retry a partial failure; delete it first and a later failure
 * strands medical histories with no way to authenticate as their owner.
 */

const order: string[] = [];

const user = { id: 'user-1', clerkId: 'clerk_1', email: 'a@b.c', role: 'patient' as const };
const deleteFolder = vi.fn(async (f: string) => void order.push(`imagekit:${f}`));
const deleteChannels = vi.fn(async () => void order.push('stream:channels'));
const deleteUser = vi.fn(async () => void order.push('stream:user'));
const deleteClerkUser = vi.fn(async () => void order.push('clerk'));

vi.mock('@/lib/auth', () => ({ requireAuth: async () => user }));
vi.mock('@/lib/imagekit', () => ({
  imagekit: () => ({ deleteFolder }),
  photoFolder: (id: string) => `/patient-uploads/ai/${id}`,
  attachmentFolder: (id: string) => `/patient-uploads/appointments/${id}`,
}));
vi.mock('@/lib/stream', () => ({
  streamServer: () => ({ deleteChannels, deleteUser }),
  streamUserId: (u: { id: string }) => u.id,
  clinicChannelId: (id: string) => `patient-${id}`,
}));
vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: async () => ({ users: { deleteUser: deleteClerkUser } }),
}));
vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({ where: async () => [{ id: 'patient-1' }, { id: 'patient-2' }] }),
    }),
    delete: () => ({ where: async () => void order.push('db') }),
  },
}));

async function runDelete() {
  order.length = 0;
  // The handler takes no arguments — it reads the caller from the Clerk session
  // via `requireAuth()`, never from the request.
  const { DELETE } = await import('./route');
  return DELETE();
}

describe('DELETE /api/me', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes our rows before Clerk, so a failure never strands PHI', async () => {
    await runDelete();
    expect(order.indexOf('db')).toBeLessThan(order.indexOf('clerk'));
  });

  it('revokes vendor assets before dropping the rows that address them', async () => {
    await runDelete();
    const db = order.indexOf('db');
    expect(order.indexOf('imagekit:/patient-uploads/ai/user-1')).toBeLessThan(db);
    expect(order.indexOf('stream:channels')).toBeLessThan(db);
    expect(order.indexOf('stream:user')).toBeLessThan(db);
  });

  it('deletes the conversations before the Stream identity', async () => {
    await runDelete();
    // deleteUser alone leaves a channel the clinic can still open and read.
    expect(order.indexOf('stream:channels')).toBeLessThan(order.indexOf('stream:user'));
  });

  it('clears both private photo folders, not just the assistant one', async () => {
    await runDelete();
    expect(deleteFolder).toHaveBeenCalledWith('/patient-uploads/ai/user-1');
    expect(deleteFolder).toHaveBeenCalledWith('/patient-uploads/appointments/user-1');
  });

  it('hard-deletes every family member’s channel', async () => {
    await runDelete();
    expect(deleteChannels).toHaveBeenCalledWith(
      ['messaging:patient-patient-1', 'messaging:patient-patient-2'],
      { hard_delete: true }
    );
  });

  it('still deletes the account when a vendor cleanup fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    deleteChannels.mockRejectedValueOnce(new Error('stream down'));
    const res = await runDelete();
    expect(res.status).toBe(200);
    expect(order).toContain('db');
    expect(order).toContain('clerk');
  });
});
