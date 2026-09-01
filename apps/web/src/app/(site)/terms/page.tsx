import type { Metadata } from 'next';

import { LegalPage } from '@/components/site-chrome';

/**
 * Published Terms of Service — the canonical text, linked from the mobile
 * sign-in screen.
 *
 * Every operative statement here is traceable to code. The reasoning, the
 * evidence citations and the open questions for counsel live in
 * `legal/reviewer-notes.md` at the repo root; they are deliberately NOT
 * published. If you change what the product does, change this page in the same
 * commit — §7 (booking rules), §10 (AI limits), §13 (usage limits) and §17
 * (deletion) assert specific behaviour and go stale first.
 */
export const metadata: Metadata = {
  title: 'Terms of Service — DentaCare',
  description:
    'The terms that govern use of the DentaCare patient app and staff dashboard.',
};

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      effective="[DATE]"
      updated="[DATE]"
      current="/terms"
      summary="The agreement between you and [LEGAL ENTITY NAME] covering the DentaCare patient app and the clinic staff dashboard."
    >
      <h2 id="acceptance">1. Acceptance of these Terms</h2>
      <p>
        These Terms of Service (<strong>&ldquo;Terms&rdquo;</strong>) are a binding agreement
        between you and [LEGAL ENTITY NAME] (<strong>&ldquo;we&rdquo;</strong>,{' '}
        <strong>&ldquo;us&rdquo;</strong>, <strong>&ldquo;our&rdquo;</strong>), the operator of the
        DentaCare patient application and staff dashboard (the <strong>&ldquo;Service&rdquo;</strong>).
      </p>
      <p>
        You accept these Terms when you sign in to the mobile application. The sign-in screen states
        that continuing constitutes agreement to our Privacy Policy and these Terms. If you do not
        agree, do not sign in and do not use the Service.
      </p>

      <h2 id="what-it-is">2. What the Service is</h2>
      <p>
        The Service supports the patients and staff of a{' '}
        <strong>single dental practice at a single location, operating in one time zone</strong>. It
        consists of:
      </p>
      <ul>
        <li>
          a <strong>patient mobile application</strong> (iOS and Android) through which you can
          create a profile, record a medical history, book and change appointments, attach images to
          a booking, message the clinic, join scheduled video or audio consultations, view past
          visits and post-operative instructions, and use an AI dental assistant; and
        </li>
        <li>
          a <strong>staff dashboard and API</strong> used by the practice&rsquo;s staff and dentists.
        </li>
      </ul>
      <p>
        Clinic staff and dentists also use the mobile application for messaging and calls; when
        signed in with a staff role, the application shows a shared clinic inbox instead of the
        patient home and appointments screens.
      </p>

      <h3>2.1 What the Service is not</h3>
      <ul>
        <li>
          <strong>The Service is not a dental or medical provider.</strong> It is scheduling,
          intake, messaging and education software used by the practice. Clinical care is provided
          by the practice and its licensed dentists under a separate relationship with you.
        </li>
        <li>
          <strong>The Service does not process payments.</strong> There is no billing, no
          subscription, no in-app purchase and no payment collection anywhere in it. Any fee for
          dental treatment is charged by the practice outside the Service.
        </li>
        <li>
          <strong>The Service does not send appointment reminders.</strong> Reminder delivery is not
          implemented. Do not rely on the Service to remind you of an appointment. The notification
          preference switches in the app are display-only today: they do not persist and they do not
          control any sending behaviour.
        </li>
        <li>
          <strong>The Service does not offer on-demand or emergency care</strong>, and it does not
          provide email or SMS communication channels.
        </li>
      </ul>
      <p>We may add, change or remove features at any time.</p>

      <h2 id="not-medical-advice">3. Not medical advice; emergencies</h2>
      <p>
        <strong>
          The Service does not provide medical or dental advice, diagnosis, or treatment.
        </strong>{' '}
        Nothing shown in the Service — including AI assistant replies, educational content, and
        post-operative instructions displayed from a past visit — is a substitute for examination by
        a licensed dentist.
      </p>
      <p>
        <strong>In an emergency, call 911 or go to the nearest emergency room.</strong> Do not use
        the messaging feature, the AI assistant, or a booking request to seek urgent care. Messages
        sent to the clinic are not monitored continuously and may not be read for an extended
        period. The AI assistant recognises certain emergency-related phrases and responds with a
        fixed instruction to seek emergency care, but that detection is keyword-based, is not a
        clinical assessment, and <strong>will not catch every emergency</strong>.
      </p>

      <h2 id="eligibility">4. Eligibility</h2>
      <ul>
        <li>
          You must be at least <strong>[MINIMUM AGE — assumed 18]</strong> years old to create an
          account. The Service does not currently verify age. It collects a date of birth during
          onboarding, but that field is optional and is not checked against any minimum.
        </li>
        <li>You must be legally able to enter into a contract.</li>
        <li>
          The Service is intended for use <strong>in the United States only</strong>, by patients of
          the practice.
        </li>
        <li>
          <strong>A child or other dependent does not get their own account.</strong> An adult
          account holder creates and manages profiles for dependents from their own account (see
          section 6).
        </li>
        <li>
          <strong>Staff and dentist access is granted by the practice</strong>, not by self-service
          signup. Roles are assigned by the practice in its identity provider and mirrored into the
          Service. Do not attempt to obtain or use staff access you have not been granted.
        </li>
      </ul>

      <h2 id="accounts">5. Accounts and sign-in</h2>
      <p>
        <strong>Sign-in method.</strong> Accounts are created and authenticated exclusively through
        our identity provider (Clerk) using <strong>third-party sign-in — Google, and Apple where
        enabled</strong>. We do not issue or store passwords. Your account therefore depends on your
        Google or Apple account remaining accessible to you; losing access to it may mean losing
        access to the Service.
      </p>
      <p>
        <strong>Your responsibilities.</strong> You are responsible for:
      </p>
      <ul>
        <li>keeping the device and third-party account used to sign in secure;</li>
        <li>
          everything done through your account, including anything done by someone you let use your
          device;
        </li>
        <li>
          the accuracy of the information you provide, in particular your medical history, allergies
          and medications. Clinical staff may rely on what you enter. Inaccurate or incomplete
          information can affect your care.
        </li>
      </ul>

      <h2 id="dependents">6. Family members and dependents</h2>
      <p>
        An account holder may create additional patient profiles (&ldquo;dependents&rdquo;) under a
        single account, and may book appointments for any profile on the account. Exactly one
        profile per account is the account holder&rsquo;s own.
      </p>
      <p>
        By creating a dependent profile, you represent that you are the parent or legal guardian of
        that person, or are otherwise authorised to provide their health information and to make
        scheduling decisions for them. You are responsible for all activity relating to profiles you
        create.
      </p>
      <p>
        Dependent profiles have no separate login.{' '}
        <strong>
          Anyone who can access your account can see every profile on it, including their medical
          histories and appointments.
        </strong>
      </p>
      <p>
        An account holder may delete a dependent profile, which also deletes that dependent&rsquo;s
        medical history and appointment records held by the Service. You cannot delete your own
        profile this way — see section 17.
      </p>

      <h2 id="appointments">7. Appointments</h2>
      <p>
        <strong>Booking is real.</strong> A confirmed booking occupies a real slot in the
        practice&rsquo;s calendar. It is not a request pending approval.
      </p>
      <p>The following rules are enforced by the Service and are not negotiable within the app:</p>
      <ul>
        <li>
          <strong>Availability.</strong> Only times the Service offers are bookable. Requests for any
          other time are rejected. The appointment&rsquo;s end time is calculated by the Service from
          the service duration; you cannot set it.
        </li>
        <li>
          <strong>Minimum notice.</strong> Appointments cannot be booked less than{' '}
          <strong>2 hours</strong> ahead.
        </li>
        <li>
          <strong>Slot times.</strong> Slots start on <strong>15-minute</strong> boundaries within
          the treating dentist&rsquo;s working hours, excluding booked time and time off.
        </li>
        <li>
          <strong>Availability window.</strong> Availability can be queried for up to{' '}
          <strong>62 days</strong> at a time.
        </li>
        <li>
          <strong>One booking per slot.</strong> If two people confirm the same slot at the same
          moment, exactly one booking succeeds. The other is told the time was just taken and must
          choose another.
        </li>
        <li>
          <strong>
            Changes and cancellations close 24 hours before the appointment start time.
          </strong>{' '}
          Inside that window you cannot cancel or reschedule in the app; call the practice. This is
          enforced by the Service, not merely by hiding a button.
        </li>
        <li>
          <strong>Rescheduling</strong> is subject to the same availability rules as an original
          booking.
        </li>
      </ul>
      <p>
        All times shown to you are in the <strong>clinic&rsquo;s local time zone</strong>, not your
        device&rsquo;s.
      </p>
      <p>
        <strong>Missed appointments.</strong> The practice may mark an appointment as completed or as
        a no-show. The Service imposes no fee for a missed or late-cancelled appointment. Any such
        policy is the practice&rsquo;s, communicated outside the Service.
      </p>
      <p>
        <strong>Attachments.</strong> You may attach images (for example an X-ray, prescription or
        referral letter) to a booking, up to <strong>10 images per appointment</strong>. Each file
        must be a <strong>JPEG, PNG, WebP or HEIC image no larger than 4 MB</strong>. Images you
        attach are stored privately and shown to clinic staff and to you; every displayed copy
        carries a visible clinic watermark.
      </p>

      <h2 id="teleconsults">8. Teleconsultations</h2>
      <p>
        Some services are teleconsultations, conducted as a video or audio call inside the mobile
        application and carried by our third-party calling provider (Stream).
      </p>
      <ul>
        <li>
          A scheduled teleconsultation can be joined from <strong>5 minutes before</strong> its start
          time until <strong>30 minutes after</strong>. Outside that window the join control is not
          offered.
        </li>
        <li>
          Either side may also place a direct call from a conversation.{' '}
          <strong>Incoming calls only reach an application that is already open.</strong> Do not rely
          on receiving a call while the app is closed or backgrounded.
        </li>
        <li>
          Calls require camera and microphone permission and a working internet connection. Call
          quality depends on your network and device, which we do not control.
        </li>
        <li>
          <strong>We do not record calls.</strong> Neither the patient application nor the staff
          application starts a recording. If the practice ever enables recording, it must obtain
          consent as required by law first.
        </li>
        <li>
          You may not record a call without the other participant&rsquo;s consent, and you may not
          use a teleconsultation for anything other than your own care or the care of a dependent on
          your account.
        </li>
      </ul>
      <p>
        Telehealth is not appropriate for every condition. A dentist may end a teleconsultation and
        ask you to be seen in person.
      </p>

      <h2 id="messaging">9. Messaging with the clinic</h2>
      <p>
        Each patient has <strong>one conversation with the clinic</strong>, not a private thread with
        an individual dentist.{' '}
        <strong>
          Every current staff member and dentist of the practice is a member of that conversation and
          can read its entire history
        </strong>
        , including staff who join the practice after your conversation was created. Your first and
        last name label the conversation so staff can identify it.
      </p>
      <p>
        Messages and any photos you attach to them are stored by our messaging provider (Stream), not
        on our own servers.
      </p>
      <p>
        Messaging is{' '}
        <strong>not monitored continuously and is not for emergencies or time-sensitive matters</strong>
        . There is no guaranteed response time.
      </p>

      <h2 id="ai">10. AI Assistant</h2>
      <p>
        The Service includes an AI dental assistant powered by a third-party large language model
        (currently OpenAI&rsquo;s <code>gpt-4o-mini</code>). By using it you acknowledge and agree to
        the following.
      </p>
      <p>
        <strong>It is education and triage only.</strong> The assistant is instructed never to
        diagnose, never to name a condition as what you have, never to recommend a drug, dose,
        frequency or brand, and never to interpret an image, X-ray or lab result.{' '}
        <strong>Its output is not medical or dental advice</strong> and must not be relied on to
        decide whether to seek or delay care.
      </p>
      <p>
        <strong>Its output may be wrong.</strong> AI-generated text can be inaccurate, incomplete or
        misleading, including when it sounds confident. Verify anything that matters with the
        practice.
      </p>
      <p>
        <strong>It cannot see your records.</strong> The assistant has no access to your profile,
        your medical history, or your appointments, and none of those are ever sent to the AI
        provider.
      </p>
      <p>
        <strong>It cannot see your photos.</strong> If you attach a photo to the assistant, the image
        is stored privately and shown back to you in the conversation, but{' '}
        <strong>it is never sent to the AI provider</strong>. The reply to a photo is a fixed message
        explaining that the assistant cannot read images.
      </p>
      <p>
        <strong>Emergency phrases bypass the model.</strong> Certain phrases — trouble breathing or
        swallowing, facial or neck swelling, uncontrolled bleeding, a knocked-out tooth, jaw trauma —
        return a fixed instruction to seek emergency care, without calling the model at all. This is
        a safety net, not a diagnosis, and it is not exhaustive.
      </p>
      <p>
        <strong>What is sent to the AI provider.</strong> When the assistant is enabled, the text of
        the current conversation (up to the most recent 30 messages) and a fixed instruction prompt
        are sent to the AI provider to generate a reply.{' '}
        <strong>
          Do not type your name, date of birth, insurance details or anything else you do not want
          sent to a third party.
        </strong>{' '}
        The assistant does not need them and cannot use them.
      </p>
      <p>
        <strong>The assistant may be unavailable.</strong> Outbound transmission to the AI provider is
        gated by a deployment setting that fails closed. When it is not enabled, the assistant returns
        an unavailability message instead of answering. The emergency response continues to work
        regardless.
      </p>
      <p>
        <strong>Your conversation is stored</strong> so the thread survives restarting the app. You
        can clear it from within the app, which deletes the stored messages and makes a best-effort
        deletion of any photos you attached to the assistant.
      </p>

      <h2 id="your-content">11. Your content and the licence you grant</h2>
      <p>
        <strong>&ldquo;Your Content&rdquo;</strong> means everything you submit to the Service:
        profile details, medical history entries, appointment reasons, images attached to a booking
        or to the assistant, messages you send to the clinic, and text you type to the AI assistant.
      </p>
      <p>
        <strong>You keep ownership of Your Content.</strong> We claim no ownership in it.
      </p>
      <p>
        You grant us a{' '}
        <strong>
          non-exclusive, worldwide, royalty-free licence to host, store, copy, transmit, display and
          reformat Your Content, and to disclose it to the third-party providers listed in section
          14, solely in order to operate the Service and support your care.
        </strong>{' '}
        &ldquo;Reformat&rdquo; means the technical processing the Service actually performs: resizing
        images, generating blurred previews, applying the clinic watermark to displayed copies of
        booking attachments, and generating short-lived signed links so an image can be displayed.
      </p>
      <p>
        This licence is limited to running the Service.{' '}
        <strong>
          It does not permit us to use Your Content for advertising or marketing, to sell it, to
          publish it, or to train AI models
        </strong>
        , and nothing in the Service does any of those things.
      </p>
      <p>
        You represent that you have the right to submit Your Content, and that images you upload are
        of you or of a dependent on your account.
      </p>
      <p>
        <strong>Clinical records.</strong> Clinical documentation created by the practice — including
        post-operative instructions and visit notes — belongs to the practice, is part of your dental
        record, and is governed by the practice&rsquo;s record-keeping obligations and its Notice of
        Privacy Practices, not by this section.
      </p>
      <p>
        <strong>Health information.</strong> Your medical history and clinical information are handled
        under the practice&rsquo;s Notice of Privacy Practices and applicable health privacy law,
        which govern over anything in these Terms that conflicts with them.
      </p>

      <h2 id="acceptable-use">12. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>
          use the Service for anyone other than yourself or a dependent on your account, or provide
          information about another person without authority to do so;
        </li>
        <li>
          impersonate another person, or attempt to obtain or use a staff or dentist role you have not
          been granted;
        </li>
        <li>
          attempt to access another patient&rsquo;s records, appointments, images, or conversations,
          or probe the Service for such access;
        </li>
        <li>
          attempt to book, cancel, or modify an appointment other than through the Service&rsquo;s own
          controls, or to circumvent availability, notice, or cancellation rules;
        </li>
        <li>
          upload anything unlawful, or anything other than images relevant to your care in the image
          upload features;
        </li>
        <li>
          upload malware, or attempt to break, overload, reverse-engineer, scrape or automate against
          the Service or its APIs;
        </li>
        <li>
          record a call without consent, or share another patient&rsquo;s or a staff member&rsquo;s
          information from a conversation;
        </li>
        <li>
          use the Service to harass, threaten or abuse clinic staff.{' '}
          <strong>
            Abusive conduct towards staff is grounds for the practice to end the relationship and for
            us to terminate your access.
          </strong>
        </li>
      </ul>

      <h2 id="limits">13. Usage limits</h2>
      <p>
        The Service enforces the following limits. We may change them, and we may add rate limiting or
        other protections at any time without notice.
      </p>
      <table>
        <thead>
          <tr>
            <th>Limit</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Assistant message length</td>
            <td>2,000 characters</td>
          </tr>
          <tr>
            <td>Medical history — allergies / medications / conditions</td>
            <td>50 entries each, 80 characters per entry</td>
          </tr>
          <tr>
            <td>Medical history notes</td>
            <td>2,000 characters</td>
          </tr>
          <tr>
            <td>Image upload size</td>
            <td>4 MB per image</td>
          </tr>
          <tr>
            <td>Image formats accepted</td>
            <td>JPEG, PNG, WebP, HEIC</td>
          </tr>
          <tr>
            <td>Images per appointment</td>
            <td>10</td>
          </tr>
          <tr>
            <td>Availability query range</td>
            <td>62 days</td>
          </tr>
          <tr>
            <td>Appointment history returned</td>
            <td>100 most recent</td>
          </tr>
          <tr>
            <td>AI conversation context</td>
            <td>30 most recent messages</td>
          </tr>
        </tbody>
      </table>
      <p>
        Links to privately stored images expire after about an hour and are regenerated when you view
        them; a link you copy and share will stop working.
      </p>

      <h2 id="third-parties">14. Third-party services</h2>
      <p>
        The Service depends on third parties. Your use of the Service involves their processing of
        your data, and their own terms and privacy policies apply to that processing in addition to
        these Terms.
      </p>
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>What it does in the Service</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Clerk</strong>
            </td>
            <td>Identity, sign-in with Google/Apple, sessions, staff roles</td>
          </tr>
          <tr>
            <td>
              <strong>Neon</strong> (PostgreSQL)
            </td>
            <td>Stores appointments, profiles, medical histories, assistant transcripts</td>
          </tr>
          <tr>
            <td>
              <strong>Stream</strong>
            </td>
            <td>
              Chat messages and their attachments; video and audio calls. Receives your first and last
              name so staff can identify your conversation
            </td>
          </tr>
          <tr>
            <td>
              <strong>ImageKit</strong>
            </td>
            <td>Private storage, transformation and delivery of images you upload</td>
          </tr>
          <tr>
            <td>
              <strong>OpenAI</strong>
            </td>
            <td>
              Generates AI assistant replies, when enabled. Receives conversation text only — never
              your records or your photos
            </td>
          </tr>
          <tr>
            <td>
              <strong>Sentry</strong>
            </td>
            <td>Error and performance monitoring for both applications</td>
          </tr>
          <tr>
            <td>
              <strong>Expo / EAS</strong>
            </td>
            <td>Mobile application runtime and distribution</td>
          </tr>
          <tr>
            <td>
              <strong>Vercel</strong>
            </td>
            <td>Hosting for the dashboard and API</td>
          </tr>
          <tr>
            <td>
              <strong>Apple App Store / Google Play</strong>
            </td>
            <td>Distribution of the mobile application</td>
          </tr>
        </tbody>
      </table>
      <p>
        We are not responsible for these providers&rsquo; acts or omissions, for their availability,
        or for changes they make to their services. If one of them is unavailable, the corresponding
        feature of the Service may be unavailable.
      </p>
      <p>
        <strong>App store terms.</strong> If you obtained the mobile application from the Apple App
        Store or Google Play, that store&rsquo;s terms also apply. Apple and Google are not parties to
        these Terms, have no obligation to provide support for the application, and are not
        responsible for it. [Apple&rsquo;s Licensed Application End User Licence Agreement requires
        specific acknowledgements — confirm the exact wording required for an App Store submission.]
      </p>

      <h2 id="ip">15. Intellectual property</h2>
      <p>
        The Service — including its software, design, text, images, logos and the clinic&rsquo;s name
        and marks — is owned by us or our licensors and is protected by intellectual property law.
        Subject to these Terms, we grant you a limited, personal, non-exclusive, non-transferable,
        revocable licence to use the mobile application for your own care and the care of dependents
        on your account.
      </p>
      <p>
        You may not copy, modify, distribute, sell, sublicense, or create derivative works from the
        Service, or remove or obscure any proprietary notice or the clinic watermark applied to
        images.
      </p>

      <h2 id="fees">16. Fees</h2>
      <p>
        <strong>The Service is provided at no charge.</strong> There are no subscriptions, no in-app
        purchases, and no payment processing in the Service.
      </p>
      <p>
        Fees for dental treatment are separate: they are charged by the practice under its own
        financial policy and are not collected, calculated, or displayed by the Service. Insurance is
        not handled by the Service.
      </p>
      <p>
        If we ever introduce paid features, we will give notice and obtain any consent required before
        charging you, and these Terms will be updated accordingly.
      </p>

      <h2 id="termination">17. Suspension, termination, and deletion of your data</h2>
      <p>
        <strong>By you.</strong> You may stop using the Service at any time and sign out from the
        profile screen.
      </p>
      <p>
        <strong>Deleting your account.</strong> Tap <strong>Delete Account</strong> on the profile
        screen and confirm. Deletion is immediate and permanent, and it takes{' '}
        <strong>every profile on the account with it</strong> — including any family member you
        added. There is no undo and no recovery period.
      </p>
      <p>
        <strong>What deletion removes.</strong> In a single operation the Service deletes:
      </p>
      <ul>
        <li>
          your account record and, by cascade, every patient profile on it, their medical histories,
          appointments, appointment attachment records, visit note associations, and your AI
          assistant conversations;
        </li>
        <li>
          the private image files held by our image provider — both the photos you attached to the
          assistant and the images you attached to a booking;
        </li>
        <li>
          your conversations with the clinic and your messaging identity at our chat and calling
          provider, deleted permanently rather than hidden;
        </li>
        <li>your sign-in identity at our identity provider.</li>
      </ul>
      <p>
        <strong>What it does not remove.</strong> Diagnostic events held by our error-monitoring
        provider are not deleted by this flow. If a third-party step fails, the Service still deletes
        your records and reports the failure to us rather than leaving your account half-deleted —
        which means a residual file at one of those providers can, rarely, survive. Email{' '}
        <strong>[SUPPORT EMAIL]</strong> and we will remove anything left within [TURNAROUND].
      </p>
      <p>
        <strong>Records the practice must keep.</strong> Deleting your app account does not delete your
        dental record. The practice is legally required to retain clinical records for a period set by
        state law and may retain information necessary for treatment, payment, legal, or regulatory
        purposes.
      </p>
      <p>
        <strong>By us.</strong> We may suspend or terminate your access, with or without notice, if you
        breach these Terms, if we reasonably believe your use is unlawful or harmful to another person
        or to the Service, if you are no longer a patient of the practice, or if we discontinue the
        Service.
      </p>
      <p>Sections 3, 11, 15 and 18 to 22 survive termination.</p>

      <h2 id="warranty">18. Disclaimers of warranty</h2>
      <p>
        <strong>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranty
          of any kind.
        </strong>{' '}
        To the fullest extent permitted by law, we disclaim all warranties, express or implied,
        including implied warranties of merchantability, fitness for a particular purpose,
        non-infringement, accuracy, and any warranty arising from course of dealing or usage of trade.
      </p>
      <p>Without limiting the above, we do not warrant that:</p>
      <ul>
        <li>the Service will be uninterrupted, timely, secure, or error-free;</li>
        <li>appointment availability shown will remain available until you confirm it;</li>
        <li>a message you send will be read within any particular time;</li>
        <li>a video or audio call will connect or maintain acceptable quality;</li>
        <li>an incoming call will reach you if the application is closed or backgrounded;</li>
        <li>
          you will receive any reminder or notification — reminder delivery is not implemented;
        </li>
        <li>AI assistant output will be accurate, complete, or suitable for any purpose.</li>
      </ul>
      <p>
        <strong>The Service requires an internet connection and does not work offline.</strong>
      </p>
      <p>
        Some jurisdictions do not allow the exclusion of certain warranties, so parts of this section
        may not apply to you.
      </p>

      <h2 id="liability">19. Limitation of liability</h2>
      <p>
        <strong>To the fullest extent permitted by law:</strong>
      </p>
      <ul>
        <li>
          We will not be liable for any indirect, incidental, special, consequential, exemplary, or
          punitive damages, or for lost profits, lost data, or loss of goodwill, arising out of or
          relating to the Service, whether based in contract, tort, strict liability, or any other
          theory, even if we have been advised of the possibility of such damages.
        </li>
        <li>
          <strong>Our total aggregate liability</strong> arising out of or relating to the Service will
          not exceed <strong>[LIABILITY CAP]</strong>. Because the Service is provided free of charge,
          there are no fees paid to serve as a measure of damages.
        </li>
      </ul>
      <p>
        <strong>
          Nothing in these Terms limits or excludes liability that cannot lawfully be limited or
          excluded, including liability for death or personal injury caused by negligence, for fraud,
          or for professional negligence in the provision of dental care.
        </strong>{' '}
        Clinical care is provided by the practice and its licensed dentists, and these Terms do not
        limit any right you have arising out of that care.
      </p>
      <p>
        Some jurisdictions do not allow these limitations, so parts of this section may not apply to
        you.
      </p>

      <h2 id="indemnity">20. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless [LEGAL ENTITY NAME], its owners, employees and
        contractors from any claim, loss, liability, or expense (including reasonable legal fees)
        arising out of:
      </p>
      <ul>
        <li>your breach of these Terms;</li>
        <li>
          content you submit, including your representation that you are authorised to submit
          information about a dependent;
        </li>
        <li>
          your misuse of the Service, including unauthorised access attempts or recording a call
          without consent.
        </li>
      </ul>
      <p>
        This does not apply to claims arising from our own negligence or misconduct, or from the
        provision of dental care.
      </p>

      <h2 id="changes">21. Changes to these Terms</h2>
      <p>
        We may update these Terms. When we do, we will change the &ldquo;Last updated&rdquo; date and,
        for material changes, give notice through the Service or by email before they take effect.
        Continuing to use the Service after a change takes effect means you accept the updated Terms.
        If you do not accept them, stop using the Service and request account deletion.
      </p>

      <h2 id="law">22. Governing law and disputes</h2>
      <p>
        These Terms are governed by the laws of the <strong>State of [GOVERNING STATE]</strong>,
        without regard to its conflict-of-laws rules.
      </p>
      <p>
        Any dispute arising out of or relating to these Terms or the Service will be brought
        exclusively in the state or federal courts located in <strong>[COUNTY, STATE]</strong>, and you
        and we consent to the personal jurisdiction of those courts. [If binding arbitration with a
        class-action waiver is preferred instead, it must be drafted by counsel and conspicuously
        disclosed at sign-up, not only here.]
      </p>
      <p>
        <strong>Severability.</strong> If any provision is held unenforceable, the rest remains in
        effect.
      </p>
      <p>
        <strong>Entire agreement.</strong> These Terms, together with the Privacy Policy and the
        practice&rsquo;s Notice of Privacy Practices, are the entire agreement between you and us
        regarding the Service.
      </p>
      <p>
        <strong>No waiver.</strong> Our failure to enforce a provision is not a waiver of it.
      </p>
      <p>
        <strong>Assignment.</strong> You may not assign these Terms. We may assign them in connection
        with a merger, acquisition, or sale of assets.
      </p>

      <h2 id="contact">23. Contact</h2>
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
        For anything urgent or clinical, call the clinic. For a medical emergency, call 911.
      </p>
    </LegalPage>
  );
}
