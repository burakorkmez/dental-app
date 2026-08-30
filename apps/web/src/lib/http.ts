import { ZodError } from 'zod';

/** Thrown anywhere below a route handler; `route()` turns it into a response. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string
  ) {
    super(message);
  }
}

export const unauthorized = (m = 'Sign in required') => new ApiError(401, m);
export const forbidden = (m = 'Not allowed') => new ApiError(403, m);
export const notFound = (m = 'Not found') => new ApiError(404, m);
export const badRequest = (m: string) => new ApiError(400, m);
export const conflict = (m: string, code?: string) => new ApiError(409, m, code);

/** Postgres exclusion-constraint violation — the double-booking guard firing. */
export function isExclusionViolation(err: unknown): boolean {
  const code = (err as { code?: string; cause?: { code?: string } })?.code
    ?? (err as { cause?: { code?: string } })?.cause?.code;
  return code === '23P01';
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

/**
 * Wraps a route handler so thrown errors become clean JSON instead of a 500.
 * Keeps every handler down to its actual business logic.
 */
export function route<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return Response.json({ error: err.message, code: err.code }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return Response.json(
          { error: 'Invalid request', issues: err.issues.map((i) => ({ path: i.path, message: i.message })) },
          { status: 400 }
        );
      }
      // Never echo the raw error: it can carry query text, and query text can carry PHI.
      console.error('[api] unhandled error', err instanceof Error ? err.message : err);
      return Response.json({ error: 'Something went wrong' }, { status: 500 });
    }
  };
}
