# Legal pages — reviewer notes

**Internal. Not published.** These notes back the two published pages:

- **Terms of Service** — `apps/web/src/app/(site)/terms/page.tsx` → `/terms`
- **Privacy Policy** — `apps/web/src/app/(site)/privacy/page.tsx` → `/privacy`

Those pages are the canonical text; there is no second copy of them in this
folder to drift out of date. This file holds the assumptions, the open
questions, and the code evidence a reviewer needs in order to check that the
published text is true.

Both pages render a visible **"Draft — not yet in force"** banner. Remove it by
passing `draft={false}` to `LegalPage` once an attorney has signed the text off.

---

## A. Assumptions made — correct any that are wrong

| # | Assumption | Where it shows up |
|---|---|---|
| 1 | The operating entity is the dental practice itself, and it is the party contracting with patients. | Throughout; ToS §1, §20 |
| 2 | Minimum age for an account holder is **18**. The code enforces no age check at all. | ToS §4, Privacy §14 |
| 3 | Governing law is the state the clinic operates in. `CLINIC_TZ` defaults to `America/New_York`, so an eastern-US state is likely — but that is a default constant, not a business fact. | ToS §22 |
| 4 | The Service is and remains **free**, and treatment fees are billed by the practice outside it. Confirmed by the absence of any billing code. | ToS §16, landing page hero |
| 5 | Dependents are minors or others for whom the account holder is a parent, guardian, or authorised representative. | ToS §6, Privacy §14 |
| 6 | The practice has, or will have, a separate **Notice of Privacy Practices**. Both pages defer to it for health information. | ToS §11, Privacy §1 |
| 7 | Court jurisdiction rather than arbitration, absent instruction. | ToS §22 |

## B. Open items you must supply

Every one of these is a `[BRACKETED PLACEHOLDER]` in the published pages or in
`src/components/site-chrome.tsx`. Search for `[` across
`apps/web/src/app/(site)` and `apps/web/src/components/site-chrome.tsx` to find
them all.

1. **Legal entity name, and one product name.** The codebase uses three:
   `DentaCare` (dashboard, design tokens, and now the public site), `Dentify`
   (AI assistant copy and the image watermark in `lib/imagekit.ts:122`), and
   `dental-app` (Expo app name, bundle id `com.dentalapp.mobile`). The site
   commits to **DentaCare**. Either rename the other two or change the site.
2. **Clinic name** — used on the landing page and in the footer.
3. **Governing state, county and venue**; arbitration vs. courts; class-action
   waiver or not.
4. **Minimum age**, and the posture on under-13 (COPPA) and under-18.
5. **Liability cap figure**, and how far the carve-out for clinical care extends.
6. **Support email, clinic phone, mailing address, Privacy Officer contact.**
7. **App Store and Google Play links** (landing page CTAs).
8. **Records retention period** for the governing state.
9. **Turnaround commitment** for manual deletion of third-party-held data.
10. **State privacy statutes** — whether a state-specific rights section is
    required in the Privacy Policy, given the HIPAA covered-entity exemption.
11. **Whether a self-service data export is wanted.** None exists; the Privacy
    Policy currently routes copy requests to email.

## C. Findings that shaped the text — evidence

Every operative statement is traceable to code. The load-bearing ones:

**No payments anywhere.** A full-repository search for Stripe, RevenueCat,
in-app purchase, subscription, checkout, or price found no implementation. The
only hits are a display-only "Billing & Payments" notification row
(`apps/mobile/src/app/(tabs)/profile/notifications.tsx:31-35`) and unrelated
comments. ToS §16 and Privacy §2 assert no payment data on this basis.

**No reminders are sent.** Phase 11 of `PLAN.md` is unbuilt: there is no
`api/cron` route, and no `push_tokens` table in `apps/web/src/db/schema.ts`.
Notification toggles are React local state that resets on unmount
(`notifications.tsx:53`). ToS §2.1 and §18 and Privacy §10 say so explicitly.
**The landing page deliberately makes no reminder claim** — check this if you
add marketing copy.

**Account deletion is implemented end to end.** `DELETE /api/me`
(`apps/web/src/app/api/me/route.ts`) is the single path: it clears both private
ImageKit folders, hard-deletes the family's Stream channels and the Stream
identity, deletes the `users` row (which cascades through every FK in
`schema.ts`), then deletes the Clerk user. The mobile button
(`apps/mobile/src/app/(tabs)/profile/index.tsx`) confirms, calls it, then signs
out — in that order, because the request needs the session token that
sign-out would discard.

Ordering is the load-bearing part and is pinned by
`apps/web/src/app/api/me/route.test.ts`: vendors before our rows (we need the
ids to address them), our rows before Clerk (while Clerk exists the patient is
still signed in and can retry; delete it first and a failure strands PHI with
no one able to authenticate as its owner), and channels before the Stream user
(deleting the user alone leaves a channel the clinic can still read). Vendor
cleanup is best-effort and logged — ToS §17 and Privacy §12 disclose that a
residual vendor file can rarely survive, which is the honest reading of it.
Sentry events are still not deleted, and both pages say so.

**Booking rules are server-enforced, so the pages can assert them.** 15-minute
granularity, 2-hour lead time, 24-hour change cutoff, and the 5/30-minute
teleconsult join window are constants in `apps/web/src/lib/scheduling.ts:11-17`,
enforced on the write path by `assertSlotBookable()`
(`apps/web/src/lib/booking.ts:84-127`) and by the 24-hour check in
`api/appointments/[id]/route.ts:94-96`. Double-booking is prevented by a
Postgres `EXCLUDE USING gist` constraint, with the violation translated to a 409
(`api/appointments/route.ts:151-156`).

**AI limits are real controls, not prompt-level promises.** Emergency detection
runs before any model call and returns fixed text
(`apps/web/src/lib/ai.ts:47-72`, `api/ai/chat/route.ts:61-72`); photos are
answered with a hard-coded reply and never transmitted
(`api/ai/attachments/route.ts:38-47`, `lib/ai.ts:80-82`); outbound transmission
fails closed on `OPENAI_TRANSMISSION_APPROVED` (`lib/ai.ts:22-24`,
`api/ai/chat/route.ts:81-87`); only the current thread's last 30 messages plus
the system prompt are sent (`api/ai/chat/route.ts:89-122`). ToS §10 and Privacy
§7 claim only these, and warn that keyword detection is not exhaustive.

**Chat has no privacy between staff.** Every staff and dentist user is added as
a member of every patient conversation, including staff hired later
(`apps/web/src/lib/stream.ts:100-121`), and the channel is named with the
patient's first and last name (`stream.ts:112`). ToS §9 and Privacy §6 disclose
this because patients will otherwise assume a private thread.

**Sentry scrubbing is real and specific.** `dataCollection` disables gen_ai
inputs/outputs, database query data, stack frame variables and http bodies
(`apps/web/sentry.server.config.ts:18-34`); Drizzle's bound parameters are
scrubbed off the error message (`lib/http.ts:34-36`); the mobile SDK drops
console breadcrumbs and reduces `event.user` to an id
(`apps/mobile/src/app/_layout.tsx:53-66`). Privacy §11 lists exactly these.

**Privacy-specific findings.** The Privacy Policy asserts a handful of things
the ToS does not, each with its own evidence:

- **No permission is ever requested for notifications.** A repository-wide
  search for `requestPermission`, `Permissions.`, `getPermissionsAsync`,
  `expo-notifications` or `Notifications.` across `apps/mobile/src` returns
  nothing, and `expo-notifications` is not a dependency. Camera and photo
  library permission strings are declared as `expo-image-picker` /
  `expo-media-library` plugin config in `apps/mobile/app.json:60-77`; the OS
  prompt fires implicitly when `launchImageLibraryAsync` is first called. This
  contradicts PLAN.md Phase 3 ("notification permission requested on the last
  screen") — the screen does not do it (`onboarding/step4.tsx:39-85`).
  Privacy §3 and §10.
- **The onboarding draft never touches disk.** `draft` is a module-level object
  reset by `resetDraft()` (`apps/mobile/src/components/onboarding.tsx:209-212`)
  with no AsyncStorage or SecureStore behind it, and it is POSTed once from step
  4. Privacy §3.
- **The avatar is the Clerk profile image**, loaded from the identity provider
  rather than stored by us (`apps/mobile/src/components/ui.tsx:391-394`).
  Privacy §2.
- **Image metadata is dropped by re-encoding, but not guaranteed.**
  `shrink()` resizes and re-saves as JPEG, which discards EXIF — but the call
  site is `await shrink(asset).catch(() => ({ uri: asset.uri }))`
  (`apps/mobile/src/lib/photo.ts:36`), so a manipulation failure uploads the
  original file with its metadata, GPS included. Privacy §9 states both halves
  rather than claiming a guarantee. **If you want the guarantee, remove the
  fallback and fail the pick instead.**
- **Log paths are scrubbed of record identifiers.** `logPath()` strips UUIDs to
  `:id` and drops the query string before anything reaches Sentry
  (`apps/mobile/src/lib/api.tsx:54-57`), and the assistant's failure log records
  path/status/duration but never the prompt or reply (`api.tsx:190-195`).
  Privacy §11.
- **No data export exists.** No export, download, CSV or share path anywhere in
  the codebase. Privacy §13 says so and routes the request to email rather than
  implying a self-service control.
- **Secrets are not committed.** `.stream/creds.yaml`, `apps/web/.env` and
  `apps/mobile/.env` are all gitignored and untracked (`git ls-files` returns
  nothing for them). No finding — recorded so the next audit does not re-derive
  it.

**The audit-log claim needed narrowing.** `audit()` is called on the patient
list (`dashboard/patients/page.tsx:16`), the patient record and its medical
history (`dashboard/patients/[id]/page.tsx:38-39`), and on note creation and
appointment completion (`[id]/actions.ts:35,56`). It is **not** called by the
day-schedule page, which renders patient names behind `requireStaff()` alone
(`dashboard/page.tsx:19,34-35,131`), and staff reads of messages happen inside
Stream rather than through this log. Privacy §7 states the coverage and its
limit explicitly. An earlier draft claimed "every staff read is audited", which
was not true.

**Usage limits (ToS §13)** come from `apps/web/src/lib/validation.ts:32-76`,
`lib/imagekit.ts:26,70-78`, `api/appointments/[id]/attachments/route.ts:18`,
`api/appointments/route.ts:59`, `lib/time.ts:55`, and
`api/ai/chat/route.ts:95`.

**There is no rate limiting.** No throttling, quota, or 429 handling exists
anywhere in the codebase. ToS §13 therefore reserves the right to add limits
rather than claiming any are enforced.

**Calls are not recorded.** No recording API call appears in either app. ToS §8
and Privacy §2 state this affirmatively — re-verify if the Stream integration
changes.

## D. Blocking issue: session replay must be resolved before publishing

`PLAN.md` assumption A15 states the build runs on **seeded fake patient data**,
and open risk R1 records that **Business Associate Agreements with Clerk, Neon,
Stream, ImageKit, Sentry and Vercel are not signed**. Two code paths are safe
only under that assumption:

- Mobile session replay is configured **unmasked** — `maskAllText`,
  `maskAllImages` and `maskAllVectors` are all `false` at a 100% sample rate
  (`apps/mobile/src/app/_layout.tsx:26-44`), which records patient names, dates
  of birth, medical history screens and chat threads to Sentry as video. The
  code comment itself flags this as contradicting the PHI rule in `CLAUDE.md`.
- The teleconsult join window gates the button, not the call room
  (`lib/scheduling.ts:134-138`).

**Privacy Policy §11 carries an explicit bracketed blocker about the first
one.** It must be resolved — by masking the replay, switching it off, or
disclosing it in those exact terms — before that page goes live. Publishing a
policy that describes careful PHI scrubbing while the app records medical
history screens as video would be worse than publishing nothing.

## E. Where the pages live and how to change them

```
apps/web/src/app/(site)/
  layout.tsx        nav + footer wrapper (route group — adds no URL segment)
  page.tsx          landing page
  terms/page.tsx    /terms
  privacy/page.tsx  /privacy

apps/web/src/components/site-chrome.tsx
  SiteNav, SiteFooter, LegalPage       legal links live in LEGAL_LINKS, once
apps/web/src/app/globals.css
  @utility legal-prose                 typography for both legal pages
```

The mobile sign-in screen opens both pages in an in-app browser from
`EXPO_PUBLIC_API_URL` (`apps/mobile/src/app/index.tsx`). There is no copy of the
text in the app binary, so a legal revision ships with a web deploy and does not
need an app store release.

## F. Reminder

**This is not legal advice and has not been reviewed by a lawyer.** The pages
were generated from source code to be factually accurate about the product's
behaviour. A qualified attorney licensed in the governing jurisdiction must
review them — with particular attention to ToS §19 (limitation of liability),
§22 (dispute resolution), the age and COPPA posture in §4, HIPAA and state
health privacy obligations, telehealth consent requirements, and Apple's App
Store requirements for health applications — before the draft banners come off.
