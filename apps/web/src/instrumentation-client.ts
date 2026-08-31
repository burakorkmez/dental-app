import * as Sentry from '@sentry/nextjs';

// The staff dashboard. No DSN leaves the SDK disabled.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,

  // ponytail: no session replay. The dashboard renders patient names, DOBs and
  // medical histories, so recording it would put PHI in Sentry as video — the
  // one thing CLAUDE.md rules out. Add it only masked, and only deliberately.
});

/** App Router navigation spans. */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
