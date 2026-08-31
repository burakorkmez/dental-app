import * as Sentry from '@sentry/nextjs';

// No DSN (dev, or a checkout without one) leaves the SDK disabled.
Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // ponytail: every transaction is sampled. Fine at this traffic — drop it to
  // ~0.1 (or a tracesSampler that keeps gen_ai traces at 1.0) once there is
  // real load. Agent tracing rides on tracing, so this must stay > 0.
  tracesSampleRate: 1.0,

  // Passing `dataCollection` at all flips every unset category to its
  // permissive default — which is what turns on gen_ai prompt/response
  // capture, and Sentry's Conversations view is reconstructed from exactly
  // that. See the PHI note in `src/app/api/ai/chat/route.ts`.
  dataCollection: {
    // The one category we do NOT want: request bodies. `/api/patients/[id]`
    // and `/api/patients/[id]/medical-history` carry records, and no error is
    // easier to debug for having a medical history attached to it.
    httpBodies: [],
  },
});
