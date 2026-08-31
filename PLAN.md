# Dental App — v1 Spec & Implementation Plan

## Context

A single local dental practice wants a patient-facing mobile app plus a staff dashboard.
Today the clinic runs on phone calls and a paper clipboard: patients call to book, fill in
medical history at the front desk, and phone the clinic at 11pm when they can't remember
their aftercare instructions. This app replaces those three things — booking, intake, and
follow-up — and adds video consultations so patients don't have to drive in for a
"is this normal?" conversation.

The build target is a working demo the clinic can hold in their hands and react to
(TestFlight), not a hardened production system on day one. But because the intake captures
medical history for US patients, HIPAA constraints are designed in from the first commit
rather than retrofitted.

---

## 1. Spec Summary

### Product & users

| | |
|---|---|
| **Problem** | Booking is phone-only; intake is paper; aftercare is forgotten; minor questions require a drive to the office. |
| **Primary user** | Patients of one local US dental practice. Open signup — anyone can join and book, so the app doubles as patient acquisition. |
| **Secondary user** | Clinic staff and dentists, on a desktop web dashboard. |
| **Must do well** | Book a real, confirmed appointment without calling. Everything else is supporting cast. |

### Surfaces

- **`apps/mobile`** — Expo React Native. Patients only.
- **`apps/web`** — Next.js. Staff/dentist dashboard **and** the API that mobile calls **and** webhook endpoints. One deploy, one schema.
- **`packages/shared`** — Zod schemas + TS types for the API contract. Nothing else lives here.

### In scope for v1

1. Auth — Apple + Google via Clerk
2. Patient onboarding: light profile + medical history
3. Dentist profiles
4. Real appointment booking (this app owns the calendar)
5. Scheduled video/audio teleconsults
6. Secure chat with the clinic, with photo attachments
7. AI dental assistant — education and triage only
8. Family members / dependents under one account
9. Visit history + post-op instructions
10. Push reminders for appointments
11. Staff dashboard: day schedule, patient records, chat, post-op notes

### Explicitly OUT of scope for v1

Payments and deposits. Insurance/ID card capture. Email and SMS channels. On-demand
calling and support presence. AI photo analysis. Multi-clinic tenancy. Web app for
patients. Staff features on mobile. Loyalty, referrals, gamification.

### Core user journeys

**New patient**
Open app → Sign in with Apple/Google → Onboarding (4 short screens: who you are →
medical history → what brings you in → notifications permission) → Home.

The **aha moment** is the first booking: pick a service → pick a dentist → see *real
available times* → confirm → it's booked, no phone call. Everything before it is
setup cost, so onboarding stays under 90 seconds and medical history is skippable
with "I'll do this later" (surfaced again before the first appointment).

**Returning patient**
Home shows: next appointment with a countdown (and a Join button when a teleconsult is
within 5 minutes), unread clinic messages, post-op instructions from the last visit.

**Teleconsult**
Book a service flagged `is_teleconsult` → at T-5min both sides get a Join button and the
patient gets a push → Stream Video call on `appointment-{id}` → ends → dentist attaches
post-op notes from the dashboard.

**Staff**
Sign in to web → today's schedule across all dentists → click a patient to see intake,
medical history, visit timeline → join teleconsults → reply to chat → write post-op notes.

### Data model

Source of truth is Neon Postgres. Clerk owns identity only; Stream owns call and message
content only; everything else is ours.

```
users                clerk_id(uniq), email, role('patient'|'staff'|'dentist'), created_at
                     └─ mirrored from Clerk via webhook

patients             account_user_id → users, is_self, first_name, last_name,
                     date_of_birth, phone, gender, primary_concern, referral_source,
                     last_visit_at
                     └─ family model: one account has N patients, exactly one is_self.
                        Appointments point at patients, never at users.

medical_histories    patient_id(uniq) → patients, allergies[], medications[],
                     conditions[], is_smoker, is_pregnant, anxiety_level, notes
                     └─ THE PHI TABLE. Every read/write hits audit_log.

dentists             user_id? → users, display_name, title, specialty, bio,
                     photo_url (ImageKit public), is_active

services             name, description, duration_minutes, is_teleconsult, is_active
dentist_services     dentist_id, service_id  (who offers what)

working_hours        dentist_id, weekday(0-6), start_time, end_time   [clinic-local]
time_off             dentist_id, starts_at, ends_at, reason           [vacation + ad-hoc]

appointments         patient_id, dentist_id, service_id, starts_at, ends_at,
                     status('booked'|'cancelled'|'completed'|'no_show'),
                     stream_call_id?, cancelled_at, cancelled_by,
                     reminder_24h_sent_at, reminder_1h_sent_at
                     └─ EXCLUDE USING gist (dentist_id WITH =,
                        tstzrange(starts_at, ends_at) WITH &&) WHERE status='booked'

visit_notes          appointment_id, body, created_by → users   [post-op, patient-readable]
attachments          imagekit_file_id, patient_id, uploaded_by, context, created_at
ai_conversations     user_id  →  ai_messages(role, content, created_at)
push_tokens          user_id, expo_push_token, updated_at
audit_log            actor_user_id, action, entity, entity_id, at
```

**Validation & invariants**
- `users.clerk_id` unique. Exactly one `is_self` patient per account.
- An appointment's `ends_at` = `starts_at` + the service's `duration_minutes`, computed
  server-side. The client never sends a duration.
- Double-booking is prevented by the Postgres exclusion constraint above, not by
  application logic. Two simultaneous bookings for the same slot: one commits, the other
  gets a constraint violation and is shown "just taken, pick another."
- Cancel/reschedule allowed until 24h before `starts_at`. Inside that window the button
  is disabled with "please call the clinic." Enforced server-side; the client only hides
  the button.

### Scheduling engine

The one piece that must be correct. `apps/web/lib/scheduling.ts`, pure functions, unit
tested.

```
availableSlots(dentistId, serviceId, dateRange) →
  1. expand working_hours across the range in clinic-local time
  2. step by 15-min granularity, each candidate = [t, t + service.duration)
  3. drop candidates overlapping any booked appointment for that dentist
  4. drop candidates overlapping time_off
  5. drop candidates in the past or inside a 2-hour minimum lead time
```

Timestamps are `timestamptz` in UTC. Working hours are clinic-local wall-clock times, so
expansion goes through a single `CLINIC_TZ` constant. This is the DST bug factory — it
gets tests covering a spring-forward and a fall-back weekend.

### Architecture

```
Expo app ──Clerk session token──> Next.js Route Handlers ──Drizzle──> Neon Postgres
   │                                      │
   │                                      ├──> OpenAI (gpt-4o-mini)   AI assistant
   │                                      ├──> Stream (server SDK)    call/chat tokens
   │                                      ├──> ImageKit               signed upload auth
   │                                      └──> Expo Push API          reminders
   │
   └──direct──> Stream Video / Stream Chat (client SDKs, server-issued tokens)
                ImageKit (direct upload with server-signed params)

Webhooks IN:  Clerk user.created/updated/deleted → sync users table
Vercel Cron:  */15 * * * *  →  /api/cron/reminders
```

Business logic lives in Route Handlers and `lib/`. The mobile app holds no business
rules — it renders what the API returns. Staff dashboard uses Server Components and
hits Drizzle directly, no HTTP hop.

### Third-party responsibilities

| Service | Owns | Version |
|---|---|---|
| **Clerk** | Identity, Apple/Google OAuth, sessions, staff invites, role in `publicMetadata` | `@clerk/expo` 4.6.1, `@clerk/nextjs` 7.8.3 |
| **Neon Postgres** | All application data, source of truth | `@neondatabase/serverless` 1.1.0, `drizzle-orm` 0.45.2 |
| **Stream** | Video/audio calls + chat messages and their storage | `@stream-io/video-react-native-sdk` 1.45.0, `stream-chat-expo` 9.8.2 |
| **ImageKit** | Image storage, transforms, CDN | `imagekit` 6.0.0 |
| **OpenAI** | AI assistant completions | `openai` 7.8.0, model `gpt-4o-mini` |
| **Sentry** | Error monitoring, both apps | `@sentry/react-native` 7.11.0 (the version Expo SDK 57 pins — not npm-latest 8.24.0), `@sentry/nextjs` 10.72.0 |
| **Expo / EAS** | Mobile runtime, builds, push delivery | `expo` 57.0.18, `expo-router` 57.0.17 |
| **Vercel** | Web hosting, API, cron | `next` 16.3.3 |

### AI assistant behavior

Education and triage only. The system prompt hard-forbids diagnosis, prescription, and
dosage advice; every substantive answer ends by offering to book. **No patient record is
ever sent to OpenAI** — no name, DOB, medical history or appointment is ever attached to
a completion request.

That is narrower than "no PHI reaches OpenAI", and the earlier wording here overstated
it. The patient types free text; a symptom description tied to a `user_id` is
individually identifiable, and nothing stops a patient typing their own name. So the
outbound call is gated on `OPENAI_TRANSMISSION_APPROVED`, which **fails closed** — set it
only where the deployment holds no real patient data (A15) or a signed BAA covers OpenAI.
Until one of those is true in production, the assistant returns
`503 ai_transmission_blocked` rather than transmitting. The emergency card is local and
keeps working regardless.

Emergency keywords (uncontrolled bleeding, facial swelling, trouble breathing/swallowing,
knocked-out tooth, jaw trauma) short-circuit the model with a hard-coded card: call the
clinic, or 911 / nearest ER. That path must never depend on an LLM's judgment.

Conversations persist in Postgres so the thread survives an app restart.

### HIPAA posture (v1)

- Sentry `beforeSend` scrub + `sendDefaultPii: false`. No patient names, DOB, or medical
  fields in any breadcrumb or log line.
- ImageKit: **private folder + signed expiring URLs** for patient dental photos; public
  folder for dentist headshots and clinic marketing images.
- Push notification bodies are generic: *"You have an appointment tomorrow at 2:00 PM."*
  Never the procedure, specialty, or dentist name — lock screens are a disclosure surface.
- `audit_log` written on every staff read/write of `medical_histories` and `patients`.
- Neon encryption at rest; DB pinned to a US region.
- Delete-account flow removes patient rows and revokes Stream/ImageKit assets.
- **BAAs required before real patient data enters the system:** Clerk, Neon, Stream,
  ImageKit, Sentry, Vercel. Tracked as a risk below, not as code.
- **OpenAI** was originally left off that list on the strength of the overstated claim
  above. It belongs on it *unless* `OPENAI_TRANSMISSION_APPROVED` stays unset in
  production — the gate is what keeps the omission honest.

---

## 2. ASSUMPTIONS

Each of these is a place you didn't give a firm answer and I picked a default. Correct
any of them and I'll adjust.

| # | Assumption | Why it's safe to change later |
|---|---|---|
| A1 | **Single clinic, single location, single timezone**, held in one `CLINIC_TZ` constant. | Multi-location means a `locations` table and location-scoped hours. Contained change. |
| A2 | **English only**, US date and time formats. | No i18n framework in v1. |
| A3 | **Dependents have no login.** A parent manages child profiles from their own account. | If a teen needs their own login later, set `patients.account_user_id` to their new user. |
| A4 | **15-minute slot granularity**, 2-hour minimum booking lead time. | Both are constants in `scheduling.ts`. |
| A5 | **Bookings are instantly confirmed** — no staff approval step, since the app owns the calendar. | Adding a `pending` status is a one-enum change. |
| A6 | **Services and dentist working hours are seeded by us**, edited by staff in the dashboard. No self-service clinic setup wizard. | |
| A7 | **Teleconsult join window** opens 5 min before and closes 30 min after `starts_at`. | Constant. |
| A8 | **Reminders at 24h and 1h**, push only. Driven by Vercel Cron every 15 min with `reminder_*_sent_at` columns for idempotency. | If timing needs to be exact, swap Cron for Trigger.dev. Same columns. |
| A9 | **Chat is one channel per patient**, id derived as `patient-{id}` — no channel table. Staff see a shared inbox, not per-dentist threads. | |
| A10 | **AI has no memory across conversations** beyond the current thread's messages. | |
| A11 | **`gpt-4o-mini`** at $0.15/$0.60 per 1M tokens. Expected spend well under $5/month at clinic scale. No token budget enforcement in v1. | Model id is one constant. |
| A12 | **No offline support.** The app requires connectivity and shows a clear offline state. | Dental booking is not an offline-first use case. |
| A13 | **Polling, not real-time**, for appointment status. Stream Chat is genuinely real-time on its own. | |
| A14 | **npm workspaces** for the monorepo. Not pnpm: Expo's Metro can't resolve pnpm's symlinked layout, so an Expo monorepo needs `node-linker=hoisted` — which discards the strict-`node_modules` benefit that is pnpm's whole point. npm hoists natively and is already installed. No Turborepo or Nx either; two apps don't need a build orchestrator. | |
| A15 | **The demo runs on seeded fake patients.** Real patient data waits for signed BAAs. | This is what makes "demo-first" and "HIPAA matters" compatible. |
| A16 | **Deployment: Vercel for web, EAS for mobile.** GitHub Actions runs typecheck + tests on push. No staging environment in v1 — a Neon branch serves as the dev DB. | |

---

## 3. OPEN RISKS

**R1 — BAAs are a business blocker, not a code blocker.** Clerk, Neon, and Stream all
gate HIPAA compliance behind paid/enterprise tiers. Nothing in the plan stops us building,
but **no real patient may use this until those are signed.** Worth pricing this week — it
may change which vendors survive.

**R2 — Expo Go will not work.** Stream Video pulls `@stream-io/react-native-webrtc`, a
native module. You need an EAS dev build before you can run the app at all, and it also
means every Stream/native dependency change needs a rebuild. Budget for this in week one;
it's the most common place this stack stalls.

**R3 — Apple review of a health app.** Apps handling health data get extra scrutiny, and
apps offering "consultations" sometimes get asked to prove clinical legitimacy. Also
required: a privacy policy URL, accurate App Privacy nutrition labels, and Sign in with
Apple offered wherever Google sign-in is (Apple mandates this). Can delay launch by weeks.

**R4 — Timezone and DST in the scheduling engine.** The single most likely source of a
real, user-visible bug: a patient shows up an hour off. Mitigated by tests, not by care.

**R5 — Will the clinic actually use the dashboard?** If staff keep their existing system
as the real calendar, this app's calendar drifts out of sync and becomes actively
dangerous — double-booked chairs. **This is the biggest product risk in the whole plan**,
and it's worth confirming with them before we build the scheduling engine.

**R6 — Nobody staffs the chat.** Secure messaging is only valuable if someone answers.
If reply latency is measured in days, patients go back to phoning. Needs a clinic-side
owner and probably an auto-reply stating expected response time.

**R7 — AI liability.** Even scoped to education, a confidently wrong answer about tooth
pain is a real-world harm. Mitigated by hard-coded emergency short-circuits, a persistent
disclaimer, and never sending patient data — but the residual risk is nonzero.

**R8 — Stream costs at scale.** Fine for one clinic; verify the pricing tier before this
is ever used by more.

**R9 — Cross-origin Clerk auth from Expo to the Next.js API** needs correct token handling
(session token in the `Authorization` header, verified server-side). Straightforward, but
it's the kind of thing that eats an afternoon.

---

## 4. Implementation Plan

Phases are ordered so that something is demoable early and the risky part (scheduling)
lands before everything that depends on it.

### Phase 0 — Foundation ✅ (except `packages/shared`, see D1; Sentry wired in mobile only)
- npm workspace: `apps/mobile`, `apps/web`, `packages/shared`.
- `apps/web`: Next.js 16.3.3 App Router, Drizzle 0.45.2 + Neon, Sentry.
- `apps/mobile`: Expo 57 + expo-router 57, Sentry (`Sentry.init` in `src/app/_layout.tsx`
  with `sendDefaultPii: false`, console breadcrumbs dropped, `event.user` reduced to the
  Clerk id; source maps via the `@sentry/react-native` config plugin + `SENTRY_AUTH_TOKEN`).
- `.env.example` in both apps listing every key. Nothing hardcoded.
- **`PLAN.md` written to the project root**, carrying this spec forward for future sessions.

### Phase 1 — Schema & seed ✅
- Full Drizzle schema per the data model above, including the raw-SQL migration for the
  `EXCLUDE USING gist` constraint (Drizzle won't generate it; it goes in a hand-edited
  migration file).
- Seed script: 3 dentists, ~8 services with real durations, working hours, and a handful
  of fake patients so screens are never empty during the demo.

### Phase 2 — Auth ✅ (backend + mobile sign-in; staff role set in Clerk)
- Clerk on both apps. Apple + Google providers only.
- `POST /api/webhooks/clerk` — verify with `verifyWebhook`, sync `users`.
- Role in `publicMetadata`, enforced in `apps/web/middleware.ts`. Staff invited from the
  Clerk dashboard.
- Mobile: `@clerk/expo` 4.6.1 with token cache, expo-router protected routes.
  Clerk app "Dentify" (`app_3IafLz8ynbSqP41ao10hlS3LvwX`). Sign-in is the browser SSO
  flow (`useSSO`); Clerk's native module is excluded from Expo autolinking, since
  linking it pulls the Clerk iOS SDK over SPM and raises the iOS floor to 17. Reverse
  the exclude in `apps/mobile/package.json` and add the `@clerk/expo` config plugin if
  the native sign-in sheets or `AuthView`/`UserButton` are ever wanted.
  **Apple is not enabled yet** — it needs an Apple Developer Services ID + key in the
  Clerk dashboard. Google works today.
- Shared `requireAuth()` / `requireStaff()` helpers for Route Handlers — written once,
  used everywhere, so authorization is never re-implemented per route.

### Phase 3 — Onboarding ✅ (see D12 — one submit at the end, not per step)
- 4 screens, skippable medical history, held in an in-memory draft and written once
  at step 4 — a drop-out before then starts over (D12).
- Writes `patients` (`is_self: true`) + `medical_histories`.
- Notification permission requested on the last screen, with a reason shown first.

### Phase 4 — Scheduling engine ✅ ← the critical phase
- `apps/web/lib/scheduling.ts` with `availableSlots()` as specified.
- `GET /api/availability?dentistId&serviceId&from&to`
- `POST /api/appointments` — server computes `ends_at`, relies on the DB constraint,
  translates a constraint violation into a clean 409.
- `PATCH /api/appointments/:id` — cancel/reschedule with the 24h rule enforced server-side.
- **Unit tests here**: normal day, fully booked day, time-off overlap, service longer than
  the remaining window, lead-time boundary, DST spring-forward, DST fall-back, and a
  concurrent double-book. This is the one place tests are non-negotiable for v1.

### Phase 5 — Booking UX ✅ (mobile flow + appointment detail with cancel; staff schedule ✅)
- Mobile: service picker → dentist picker → calendar with real slots → confirm → detail
  screen with cancel/reschedule.
- Web dashboard: day and week views across dentists, click-through to the patient record
  (intake, medical history, visit timeline), manual block-out and cancel.

### Phase 6 — Teleconsult
- `POST /api/stream/token` issues user tokens server-side.
- Call id `appointment-{id}`; join gated to the T-5min → T+30min window on the server.
- Stream Video RN SDK in mobile, Stream Video React SDK on the dashboard.
- **Requires an EAS dev build — do this before starting the phase, not during.**

### Phase 7 — Chat
- Stream Chat, channel `patient-{id}`, members = the patient + the staff team.
- Photo attachments upload to ImageKit's private folder via server-signed params; the
  message carries a signed URL.

### Phase 8 — AI assistant ✅ (thread persisted in `ai_conversations` / `ai_messages`)
- `POST /api/ai/chat` — streams from `gpt-4o-mini`, persists to `ai_conversations` /
  `ai_messages`.
- Emergency keyword check runs **before** the model call and returns the hard-coded card.
- System prompt: education only, no diagnosis, no dosages, always offer to book.
- Persistent disclaimer in the chat UI header.

### Phase 9 — Visit history & post-op notes ✅ (patient timeline = Past tab → appointment detail)
- Patient timeline of past appointments with their `visit_notes`.
- Staff compose notes from the appointment detail view on the dashboard.

### Phase 10 — Family members — API ✅; booking picks any family member ✅, add/edit dependents still pending
- Add/edit dependent profiles from the mobile profile screen.
- A "who is this for?" step enters the booking flow; home shows appointments across the
  whole family.

### Phase 11 — Push reminders
- `push_tokens` registration on login and on token refresh.
- `/api/cron/reminders` every 15 min: find appointments in the 24h and 1h windows with a
  null `reminder_*_sent_at`, send generic-body pushes, stamp the column.
- Teleconsult T-5min "join now" push in the same job.

### Phase 12 — Harden & ship the demo
- Sentry PHI scrubbing verified by deliberately triggering an error with a patient loaded.
- `audit_log` writes wired into every staff PHI access path.
- Empty states, offline state, and error states on every screen.
- GitHub Actions: typecheck + scheduling tests.
- EAS build → TestFlight.

---

---

## 6. Decisions since the plan was written

Recorded here because §4 above is now partly built and these differ from what it assumed.

| # | Decision | Why |
|---|---|---|
| D1 | **`packages/shared` not created.** Zod schemas live in `apps/web/src/lib/validation.ts`. | There is exactly one consumer today. It becomes a package the moment mobile needs to import a type, not before. |
| D2 | **`middleware.ts` is `proxy.ts`.** Next 16 renamed the convention. | Not optional — `middleware.ts` is deprecated in 16. |
| D3 | **No route matching in `proxy.ts`.** `clerkMiddleware()` runs bare; every guard is resource-based (`requireStaff()` in the dashboard layout, `requireAuth()` in each route). | Clerk Core 3 deprecated `createRouteMatcher`: path matching can diverge from how Next routes and leave a resource reachable. Also lets API routes answer a mobile client with JSON 401 instead of an HTML redirect. |
| D4 | **`requireAuth()` upserts the `users` row** instead of waiting for the Clerk webhook. | Webhook delivery is eventually consistent; a new patient must not be blocked on it. The webhook stays the backstop for updates and deletes. |
| D5 | **Availability aggregates across every dentist offering the service**, and each slot carries its `dentistId`. `?dentistId=` narrows it. | The mobile booking flow picks a time, not a dentist — there is no dentist picker in the built UI. |
| D6 | **`@date-fns/tz` added** for clinic-local → UTC expansion. | Hand-rolled DST math is exactly the flimsy-algorithm risk R4 warns about. One small dependency, and the DST tests prove it. |
| D7 | **`services` gained a `key` column** (`checkup`, `cleaning`, `pain`, `white`, `ortho`, `resto`, `followup`, `video`). | Lets the mobile app keep its existing per-service artwork keyed to a stable id instead of matching on a display name. |
| D8 | **`push_tokens` and `attachments` tables deferred** to their own phases. | Nothing references them yet. Adding a table later is a migration; carrying an unused one is dead weight. |
| D9 | **Teleconsult `stream_call_id` is derived server-side** as `appointment-{id}` at booking time, even though Phase 6 is not built. | It is one line at insert, and it means the call id is never client-supplied later. |
| D10 | **No data-fetching library on mobile.** `src/lib/api.tsx` is the whole client: a Clerk-token `fetch` wrapper, a `useApi` hook that refetches on screen focus, and a `MeProvider` holding `/api/me`. | Refetch-on-focus is all the cache invalidation these screens need, and it is ~90 lines. React Query earns its place when there is state worth sharing between screens that a refocus cannot fix. |
| D11 | **`service.key` rides along on appointment payloads**, not just on `/api/services`. | The mobile cards pick their artwork by key (D7). Matching on a display name would break the moment the clinic renames a service. |
| D12 | **Onboarding posts once, from step 4** — not per step as §4 assumed. | `hasOnboarded` is defined as "a `is_self` patient row exists". Writing that at step 1 would mark onboarding done for someone who then drops out at step 2, and they would never be asked again. Resuming a drop-out needs a separate progress flag, which v1 does not have. |
| D13 | **Preferred appointment time (onboarding step 4) is collected but not stored.** | No column, and no scheduling behaviour reads it yet. Adding one is a migration for a field nothing consumes. |


## 5. Verification

**Scheduling engine (automated).** `npm test -w apps/web`. Covers the eight cases in
Phase 4. If these pass and the exclusion constraint is in place, the calendar is sound.

**Double-booking (manual, and worth doing by hand once).** Two devices on the same slot,
confirm simultaneously. Exactly one succeeds; the other sees "just taken." Then confirm
in `psql` that only one `booked` row exists for that dentist and range.

**End-to-end demo script** — run this before showing the clinic:
1. Fresh signup with Apple → onboarding → land on home.
2. Book a cleaning → verify the slot disappears for other users and appears on the staff
   dashboard.
3. Book a teleconsult 10 minutes out → wait for the T-5min push → join from mobile, join
   from the dashboard → confirm two-way audio and video.
4. Send a chat message with a photo → staff replies → patient receives it.
5. Ask the AI "why does my tooth hurt when I drink cold water?" → get a useful,
   non-diagnostic answer ending in a booking offer. Then ask about facial swelling and
   trouble breathing → confirm the hard-coded emergency card appears and the model is
   never called.
6. Staff marks the appointment complete and adds post-op notes → patient sees them in
   visit history.
7. Add a dependent → book for them → confirm it shows under the parent's account.
8. Try to cancel an appointment 2 hours out → blocked with the "call the clinic" message.

**HIPAA spot-check.** Throw an error on a screen with a patient record loaded; confirm the
Sentry event carries no name, DOB, or medical field. Confirm a patient photo URL 403s once
its signature expires. Confirm a reminder push body names no procedure.
