import type { Metadata } from 'next';

import { LegalPage } from '@/components/site-chrome';

/**
 * Published Privacy Policy — the canonical text, linked from the mobile
 * sign-in screen, the site navbar and the site footer.
 *
 * Every statement here describes what the code actually does. The sections that
 * go stale fastest, and must be re-checked on any change to a data flow:
 *
 *   §3  device permissions      → apps/mobile/app.json plugin declarations
 *   §7  storage and audit       → the `audit()` call sites in src/app/dashboard
 *   §8  the AI assistant        → src/lib/ai.ts, api/ai/chat, api/ai/attachments
 *   §9  image metadata          → apps/mobile/src/lib/photo.ts `shrink()`
 *   §11 diagnostics             → sentry.server.config.ts, apps/mobile _layout.tsx
 *   §12 deletion                → api/webhooks/clerk + the schema's cascades
 *
 * Evidence and open questions: `legal/reviewer-notes.md` (not published).
 *
 * This is NOT a HIPAA Notice of Privacy Practices — §1 says so and defers.
 */
export const metadata: Metadata = {
  title: 'Privacy Policy — DentaCare',
  description:
    'What the DentaCare app collects, who receives it, how it is protected, and what you can delete.',
};

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      effective="[DATE]"
      updated="[DATE]"
      current="/privacy"
      summary="What information the DentaCare app collects, where it goes, what protects it, and what we never do with it."
    >
      <h2 id="scope">1. Who this covers, and what it is not</h2>
      <p>
        This policy explains how [LEGAL ENTITY NAME] (<strong>&ldquo;we&rdquo;</strong>) handles
        information in the DentaCare patient application and staff dashboard (the{' '}
        <strong>&ldquo;Service&rdquo;</strong>). It applies to patients of [CLINIC NAME] and to
        clinic staff using the Service.
      </p>
      <p>
        <strong>This is not a HIPAA Notice of Privacy Practices.</strong> The practice is a covered
        health care provider and maintains a separate Notice of Privacy Practices describing your
        rights in your dental record and how protected health information may be used and disclosed
        for treatment, payment and health care operations. Where that notice and this policy differ
        about health information, <strong>the Notice of Privacy Practices governs</strong>. See
        [LINK TO NOTICE OF PRIVACY PRACTICES].
      </p>

      <h2 id="what-we-collect">2. What we collect</h2>
      <p>
        We collect only what the Service needs in order to work. Everything below is something a
        specific feature reads or writes; there is nothing collected &ldquo;just in case&rdquo;.
      </p>

      <h3>Account and identity</h3>
      <ul>
        <li>
          Your <strong>email address</strong> and an identifier from the Google or Apple account you
          sign in with. These come from our identity provider — we never see or store a password,
          because the Service has none.
        </li>
        <li>
          The <strong>profile photo</strong> attached to that Google or Apple account, if it has one.
          The app displays it as your avatar. We do not store a copy; it is loaded from the identity
          provider each time.
        </li>
        <li>Your role in the Service: patient, staff, or dentist.</li>
      </ul>

      <h3>Patient profile</h3>
      <ul>
        <li>
          First and last name. <strong>Required.</strong>
        </li>
        <li>
          Date of birth, phone number, gender, what brings you in, and how you heard about the
          practice. <strong>All optional.</strong>
        </li>
        <li>The same fields for any dependent profile you create.</li>
      </ul>

      <h3>Medical history</h3>
      <ul>
        <li>
          Allergies, medications and medical conditions you list; whether you smoke; whether you are
          pregnant; a dental anxiety rating; and any free-text notes you add.
        </li>
        <li>
          This is the most sensitive information the Service holds, and it is{' '}
          <strong>entirely optional</strong> — onboarding lets you skip it and add it later from your
          profile.
        </li>
      </ul>

      <h3>Appointments and visits</h3>
      <ul>
        <li>Which service, which dentist, start and end time, and status.</li>
        <li>Who cancelled an appointment and when, if one is cancelled.</li>
        <li>Post-operative instructions and visit notes written by clinic staff.</li>
      </ul>

      <h3>Images you upload</h3>
      <ul>
        <li>Images attached to a booking — for example an X-ray, prescription or referral letter.</li>
        <li>Photos you attach to the AI assistant.</li>
      </ul>

      <h3>Messages and conversations</h3>
      <ul>
        <li>Messages and attachments you exchange with the clinic.</li>
        <li>The text of your conversations with the AI assistant.</li>
      </ul>

      <h3>Technical and diagnostic data</h3>
      <ul>
        <li>
          Crash reports, error events, performance traces, and mobile app session recordings, used to
          find and fix faults. Section 11 describes this in detail and is the section most worth
          reading.
        </li>
      </ul>

      <h3>What we do not collect</h3>
      <ul>
        <li>
          <strong>No payment or insurance information.</strong> The Service contains no billing code
          of any kind.
        </li>
        <li>
          <strong>No location data.</strong> The app never requests location permission.
        </li>
        <li>
          <strong>No contacts, no calendar, no advertising identifier</strong>, and no third-party
          analytics or advertising SDKs.
        </li>
        <li>
          <strong>No call recordings.</strong> Video and audio consultations are not recorded by
          either the patient app or the staff app.
        </li>
        <li>
          <strong>No password.</strong> Sign-in is delegated entirely to Google or Apple.
        </li>
      </ul>

      <h2 id="permissions">3. Device permissions</h2>
      <p>The app asks your device for only what a feature you are using needs:</p>
      <ul>
        <li>
          <strong>Photo library</strong> — asked the first time you attach an image to a booking or
          to the assistant. Decline and everything else keeps working.
        </li>
        <li>
          <strong>Camera and microphone</strong> — asked when you join a video consultation, and used
          only for the duration of that call.
        </li>
        <li>
          <strong>Notifications</strong> — <strong>never asked</strong>. The Service does not send
          push notifications at all today (see section 10).
        </li>
      </ul>
      <p>
        You can withdraw any of these in your device settings at any time. Only the feature that
        needs it stops working.
      </p>
      <p>
        While you are filling in the four onboarding screens, your answers are held{' '}
        <strong>in memory on the phone only</strong> and are sent to us in one go on the last screen.
        Nothing is written to the device&rsquo;s storage, and quitting partway through discards it.
      </p>

      <h2 id="how-we-use">4. How we use it</h2>
      <ul>
        <li>To create and maintain your account and your family&rsquo;s profiles.</li>
        <li>To show real appointment availability, and to book, change and cancel appointments.</li>
        <li>
          To give clinic staff what they need to treat you — your intake, medical history and visit
          timeline.
        </li>
        <li>To carry your messages and video consultations with the clinic.</li>
        <li>To generate AI assistant replies, subject to the limits in section 8.</li>
        <li>To store and display images you upload.</li>
        <li>To keep the Service working: diagnose faults, prevent abuse, and keep it secure.</li>
        <li>To meet legal, regulatory and record-keeping obligations.</li>
      </ul>

      <h2 id="never">5. What we never do</h2>
      <ul>
        <li>
          <strong>We do not sell your information</strong>, and we do not share it with advertisers or
          data brokers.
        </li>
        <li>
          <strong>We do not use your information for advertising or marketing.</strong>
        </li>
        <li>
          <strong>We do not use your information to train AI models</strong>, ours or anyone
          else&rsquo;s.
        </li>
        <li>
          <strong>We never send your patient record to the AI provider</strong> — not your name, date
          of birth, medical history, or appointments. See section 8.
        </li>
        <li>
          <strong>We do not put health information in a notification, a log line, or an error
          report.</strong> Sections 10 and 11 describe the specific measures.
        </li>
      </ul>

      <h2 id="sharing">6. Who receives your information</h2>
      <p>
        <strong>Inside the practice.</strong> Clinic staff and dentists can see what they need for
        your care: your profile, your medical history, your appointments, your booking attachments,
        and your conversation with the clinic. Note in particular that{' '}
        <strong>
          the clinic conversation is shared with the whole staff team, not with one dentist
        </strong>{' '}
        — every current staff member and dentist is a member of it and can read its full history,
        including people who join the practice later.
      </p>
      <p>
        <strong>Service providers.</strong> The Service runs on third-party infrastructure. Each
        receives only what its function requires:
      </p>
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>What it receives</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Clerk</strong> — identity
            </td>
            <td>Your email address, sign-in identity and profile photo. No health information.</td>
          </tr>
          <tr>
            <td>
              <strong>Neon</strong> — database
            </td>
            <td>
              Everything the Service stores itself: profiles, medical histories, appointments, visit
              notes, AI conversation text, audit entries.
            </td>
          </tr>
          <tr>
            <td>
              <strong>Stream</strong> — chat and calls
            </td>
            <td>
              Your messages and their attachments, call metadata, and your first and last name, so
              staff can identify your conversation in a shared inbox.
            </td>
          </tr>
          <tr>
            <td>
              <strong>ImageKit</strong> — image storage
            </td>
            <td>Images you upload, stored in a private folder. See section 9.</td>
          </tr>
          <tr>
            <td>
              <strong>OpenAI</strong> — AI assistant
            </td>
            <td>
              The text of your assistant conversation only, and only when the assistant is enabled.
              Never your records, never your photos. See section 8.
            </td>
          </tr>
          <tr>
            <td>
              <strong>Sentry</strong> — error monitoring
            </td>
            <td>Diagnostic events and mobile session recordings. See section 11.</td>
          </tr>
          <tr>
            <td>
              <strong>Vercel</strong>, <strong>Expo / EAS</strong>
            </td>
            <td>Hosting and app distribution. Request metadata in the ordinary course.</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>Legal.</strong> We may disclose information if required by law, court order, or a
        valid legal request, or to protect someone&rsquo;s safety.
      </p>
      <p>
        <strong>Business transfer.</strong> If the practice is sold or merged, records may transfer as
        part of it, subject to the same protections.
      </p>

      <h2 id="storage">7. Where it is stored, and what protects it</h2>
      <ul>
        <li>
          Application data is held in a <strong>PostgreSQL database in a United States region</strong>
          , encrypted at rest.
        </li>
        <li>Data in transit is encrypted over HTTPS.</li>
        <li>
          Your session token on the phone is kept in the device&rsquo;s{' '}
          <strong>secure storage</strong> — Keychain on iOS, Keystore on Android — not in ordinary app
          storage.
        </li>
        <li>
          <strong>Every request is authorised against your own account.</strong> A request for a
          patient, appointment, image or conversation that is not yours returns &ldquo;not
          found&rdquo; — the Service does not confirm that another patient&rsquo;s record exists.
        </li>
        <li>
          <strong>Your chat and call identity is issued by our server</strong>, derived from your
          signed-in session. The app cannot name its own identity, so one patient cannot obtain
          another person&rsquo;s — or a staff member&rsquo;s — messaging credentials.
        </li>
        <li>Access to the staff dashboard requires a staff or dentist role, checked on every page.</li>
      </ul>
      <p>
        <strong>Audit logging.</strong> When a staff member opens the patient list, or opens an
        individual patient&rsquo;s record and medical history, the Service writes an audit entry
        recording who, what and when. The entry records the action and the record identifier —{' '}
        <strong>never the contents</strong>. Staff also record an entry when they add a visit note or
        mark an appointment complete.
      </p>
      <p>
        To be precise about the limit of this: the audit log covers the patient list and the patient
        record screens. It does{' '}
        <strong>not</strong> cover every screen on which a name can appear — the day-schedule view
        lists appointments with patient names and does not currently write an entry, and staff access
        to messages happens inside our chat provider rather than through this log.
      </p>

      <h2 id="ai">8. The AI assistant</h2>
      <p>This is what people most often ask about, so it is spelled out precisely.</p>
      <ul>
        <li>
          <strong>What is sent:</strong> the text of your current assistant conversation — up to the
          most recent 30 messages — plus a fixed instruction prompt.
        </li>
        <li>
          <strong>What is never sent:</strong> your name, date of birth, phone number, medical
          history, appointments, or any other record. The assistant has no access to them at all.
        </li>
        <li>
          <strong>Photos are never sent.</strong> A photo you attach to the assistant is stored
          privately and shown back to you. The reply is fixed text; no model is called, and the photo
          turn is removed from the conversation the model is shown.
        </li>
        <li>
          <strong>Emergency phrases never reach the model.</strong> They are matched before any
          outbound call and answered with fixed text.
        </li>
        <li>
          <strong>Transmission is gated and fails closed.</strong> Sending your text to the AI
          provider requires an explicit deployment setting. Where it is not enabled, the assistant
          reports that it is unavailable rather than transmitting anything.
        </li>
      </ul>
      <p>
        Because you type freely, only you control what ends up in that text.{' '}
        <strong>
          Do not type your name, date of birth, insurance details, or anything else you would not want
          sent to a third party.
        </strong>{' '}
        The assistant does not need them and cannot use them.
      </p>
      <p>
        You can clear your assistant conversation from within the app. That deletes the stored
        messages and makes a best-effort deletion of the photos you attached to it.
      </p>

      <h2 id="images">9. Images you upload</h2>
      <ul>
        <li>
          Images are stored in a <strong>private folder</strong> at our image provider. They are not
          publicly reachable.
        </li>
        <li>
          They are displayed through <strong>signed links that expire after about an hour</strong>, so
          a link that is copied or forwarded stops working.
        </li>
        <li>
          Booking attachments carry a <strong>visible clinic watermark</strong> on every displayed
          copy, so a screenshot shows where it came from.
        </li>
        <li>
          Assistant photos are shown blurred in the conversation until you tap to reveal them. The blur
          is a screen against someone glancing at your phone; the private folder is what actually
          protects the file.
        </li>
        <li>
          Uploads go <strong>through our own server</strong> rather than straight from your phone to
          the image provider, so where a file lands and whether it is private are set by us and cannot
          be influenced by the app or by anyone using it.
        </li>
        <li>
          The stored filename is generated by us. Your original filename is never used.
        </li>
      </ul>
      <p>
        <strong>Embedded metadata.</strong> Before upload, the app resizes your image and re-encodes
        it as a JPEG, which discards the metadata a camera embeds — including any GPS coordinates.{' '}
        <strong>
          If that re-encoding fails for a particular image, the original file is uploaded instead,
          with its metadata intact.
        </strong>{' '}
        We would rather tell you that than claim a guarantee the code does not make. If an image&rsquo;s
        embedded location matters to you, strip it before attaching it.
      </p>

      <h2 id="notifications">10. Notifications</h2>
      <p>
        <strong>The Service does not send push notifications.</strong> Appointment reminders are not
        implemented, no notification permission is ever requested, and the notification preference
        switches in the app do not currently control anything.
      </p>
      <p>
        If reminders are added later, notification text will be kept generic — for example{' '}
        <em>&ldquo;You have an appointment tomorrow at 2:00 PM&rdquo;</em> — and will never name a
        procedure, a specialty, or a dentist, because a lock screen is visible to anyone holding the
        phone. This policy will be updated before that ships.
      </p>

      <h2 id="diagnostics">11. Diagnostic and error data</h2>
      <p>
        We use an error-monitoring service (Sentry) to find and fix faults in both applications. It
        receives crash reports, error messages and performance traces.
      </p>
      <p>The following are deliberately stripped before anything is sent:</p>
      <ul>
        <li>
          <strong>Database values.</strong> A name, date of birth or medical history row bound into a
          failing query is replaced with a placeholder before the report leaves our server.
        </li>
        <li>
          <strong>Request bodies</strong> for every endpoint, including those carrying profiles and
          medical histories.
        </li>
        <li>
          <strong>Local variables</strong> from a failing handler, which would otherwise carry the
          same data one frame up.
        </li>
        <li>
          <strong>Assistant prompts and replies.</strong> When a request to the assistant fails, we
          record the endpoint, the status and how long it took — never what you typed or what came
          back.
        </li>
        <li>
          <strong>Record identifiers in log lines.</strong> A path like{' '}
          <code>/api/patients/&lt;id&gt;/medical-history</code> is reduced to{' '}
          <code>/api/patients/:id/medical-history</code>, and query strings are dropped, so a
          diagnostic line never points at an individual record.
        </li>
        <li>
          <strong>Your email address and display name.</strong> A diagnostic event carries an opaque
          account identifier only.
        </li>
        <li>
          <strong>Console output</strong> from the mobile app, which would otherwise carry whatever
          was being logged.
        </li>
        <li>
          <strong>Session recording of the staff dashboard</strong>, which is never recorded, because
          it renders patient names, dates of birth and medical histories.
        </li>
      </ul>
      <p>
        <strong>Mobile session recordings.</strong> The patient app records app sessions to help
        diagnose faults.{' '}
        <strong>
          [BEFORE PUBLISHING: the current build records session video without masking, capturing
          whatever is on screen — including names, dates of birth, medical history screens and chat
          threads. This must either be masked, or switched off, or disclosed here in exactly those
          terms. Do not publish this page while this sentence is unresolved.]
        </strong>
      </p>

      <h2 id="retention">12. How long we keep it, and deletion</h2>
      <p>
        <strong>Deleting your account.</strong> Tap <strong>Delete Account</strong> on the profile
        screen and confirm. It happens immediately, it is permanent, and it removes{' '}
        <strong>every profile on the account</strong> — including any family member you added. There
        is no undo and no grace period.
      </p>
      <p>One confirmation removes all of the following:</p>
      <ul>
        <li>your account record and every patient profile on it;</li>
        <li>the medical history attached to each of those profiles;</li>
        <li>your appointments, their attachment records and their visit notes;</li>
        <li>your AI assistant conversations and their messages;</li>
        <li>
          the private image files at our image provider — both assistant photos and booking
          attachments, without needing to clear your assistant history first;
        </li>
        <li>
          your conversations with the clinic and your messaging identity at our chat and calling
          provider, deleted permanently rather than hidden from view;
        </li>
        <li>your sign-in identity at our identity provider.</li>
      </ul>
      <p>
        <strong>What it does not remove.</strong> Diagnostic events and session recordings held by our
        error-monitoring provider are not deleted by this flow.
      </p>
      <p>
        <strong>One honest caveat.</strong> Your records are deleted even if a third-party cleanup step
        fails — we would rather remove your medical history and log the failure than refuse the whole
        deletion because one vendor was unreachable. That means a residual file at one of those
        providers can, rarely, survive. Email <strong>[SUPPORT EMAIL]</strong> and we will remove
        anything left within [TURNAROUND].
      </p>
      <p>
        <strong>Deleting a dependent.</strong> An account holder can delete a dependent&rsquo;s profile
        from the app, which deletes that dependent&rsquo;s medical history and appointment records.
      </p>
      <p>
        <strong>Records the practice must keep.</strong> Deleting your app account does not delete your
        dental record. The practice is required by state law to retain clinical records for a set
        period, and may retain what is necessary for treatment, payment, legal or regulatory purposes.
        [CONFIRM RETENTION PERIOD FOR [GOVERNING STATE].]
      </p>

      <h2 id="rights">13. Your choices and rights</h2>
      <ul>
        <li>
          <strong>See and correct your information.</strong> Your profile and medical history are
          viewable and editable in the app at any time.
        </li>
        <li>
          <strong>Give less.</strong> Medical history is optional in full. Date of birth, phone,
          gender, concern and referral source are each optional.
        </li>
        <li>
          <strong>Clear your assistant history</strong> from within the assistant screen.
        </li>
        <li>
          <strong>Withdraw a device permission</strong> in your device settings. Only the feature that
          needed it stops working.
        </li>
        <li>
          <strong>Request deletion</strong> — see section 12.
        </li>
        <li>
          <strong>Request a copy.</strong> There is{' '}
          <strong>no self-service data export in the app</strong>. Email{' '}
          <strong>[SUPPORT EMAIL]</strong> and we will assemble a copy of the information we hold about
          you.
        </li>
        <li>
          <strong>Rights in your dental record</strong> — including access, amendment, and an accounting
          of disclosures — are described in the practice&rsquo;s Notice of Privacy Practices, which is
          the controlling document for those.
        </li>
      </ul>
      <p>
        [If the practice serves residents of California, Colorado, Virginia, Connecticut, Texas or other
        states with comprehensive privacy statutes, counsel should confirm whether a state-specific
        rights section and a &ldquo;Do Not Sell or Share&rdquo; statement are required here. Information
        held by a HIPAA covered entity is commonly exempt.]
      </p>

      <h2 id="children">14. Children and dependents</h2>
      <p>
        The Service is not intended for use by anyone under [MINIMUM AGE — assumed 18] on their own. A
        child does not get their own account or login. A parent or guardian creates a profile for their
        child from their own account and provides that child&rsquo;s information.
      </p>
      <p>
        We do not knowingly allow a child to create an account. If you believe one has, contact{' '}
        <strong>[SUPPORT EMAIL]</strong> and we will remove it.
      </p>

      <h2 id="cookies">15. Cookies and similar technologies</h2>
      <p>
        The staff dashboard uses cookies set by our identity provider to keep staff signed in. These are
        strictly necessary for it to function.{' '}
        <strong>
          There are no advertising cookies, no analytics cookies, and no third-party trackers
        </strong>{' '}
        in the dashboard or on this website. The mobile app does not use cookies; it holds a session
        token in the device&rsquo;s secure storage.
      </p>

      <h2 id="changes">16. Changes to this policy</h2>
      <p>
        We may update this policy. We will change the &ldquo;Last updated&rdquo; date, and for a
        material change we will give notice in the Service or by email before it takes effect.
      </p>

      <h2 id="contact">17. Contact</h2>
      <p>
        [LEGAL ENTITY NAME]
        <br />
        [STREET ADDRESS]
        <br />
        [CITY, STATE, ZIP]
        <br />
        Email: <strong>[SUPPORT EMAIL]</strong>
        <br />
        Phone: <strong>[CLINIC PHONE]</strong>
      </p>
      <p>
        For a privacy concern about your dental record specifically, contact the practice&rsquo;s
        Privacy Officer: <strong>[PRIVACY OFFICER CONTACT]</strong>.
      </p>
    </LegalPage>
  );
}
