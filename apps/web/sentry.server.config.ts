import * as Sentry from '@sentry/nextjs';

import { scrubQuery } from './src/lib/http';

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
    // Every category left unset above defaults to permissive, so the three that
    // would carry PHI have to be named. `genAI` is the assistant thread — what
    // the patient typed about their own symptoms, which is exactly the content
    // Sentry's Conversations view is reconstructed from (see the PHI note in
    // `src/app/api/ai/chat/route.ts`). `databaseQueryData` is the bound
    // parameters on a db span: a name, a DOB, a medical-history row.
    // `stackFrameVariables` is every local in a failing handler, which is the
    // same data one frame up.
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    stackFrameVariables: false,
  },

  // The span attributes above are only half of it: Drizzle puts the bound
  // parameters in the *message* of the error it throws, and that message is the
  // event title. Scrub it wherever an exception reaches Sentry — `route()` is
  // the common path, but server actions and `onRequestError` are not.
  beforeSend: (event) => {
    for (const e of event.exception?.values ?? []) {
      if (e.value) e.value = scrubQuery(e.value);
    }
    return event;
  },
});
