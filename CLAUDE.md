# Dental App

Read `PLAN.md` first — it holds the v1 spec, the data model, the numbered
ASSUMPTIONS (A1–A16), and the open risks. Keep it current when decisions change.

## Layout

- `apps/mobile` — Expo 57 patient app. See `apps/mobile/AGENTS.md`.
- `apps/web` — Next.js 16. Staff dashboard **and** the API the mobile app calls
  **and** the webhook endpoints. One deploy. See `apps/web/AGENTS.md`.

npm workspaces (not pnpm — see assumption A14). `npm install` at the root.

## Non-negotiables

- **PHI never leaves the boundary.** No patient name, DOB, or medical field in a
  Sentry event, a log line, an analytics call, or a push notification body.
- **No patient record is ever sent to OpenAI.** The assistant is education and
  triage only.
- **Double-booking is prevented by a Postgres exclusion constraint**, not by
  application logic. Do not replace it with an app-level check.
- Business logic lives in `apps/web`. The mobile app renders what the API returns.
