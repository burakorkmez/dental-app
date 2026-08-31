import * as Sentry from '@sentry/nextjs';

export async function register() {
  // ponytail: node only. Nothing here runs on the edge — `src/proxy.ts` is
  // Next 16's renamed middleware and defaults to the node runtime, and no
  // route exports `runtime = 'edge'` (verified: the proxy's spans come out of
  // this init). Add a `sentry.edge.config.ts` branch the day one does.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }
}

/** Catches server errors Next.js handles before a route handler can. */
export const onRequestError = Sentry.captureRequestError;
