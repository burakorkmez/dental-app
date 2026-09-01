import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';

import signinHome from '@/assets/app-signin-home.png';
import signin from '@/assets/app-signin.png';
import threeScreens from '@/assets/app-three-screens.png';

import {
  CalendarIcon,
  ChatIcon,
  ClipboardIcon,
  HeartPulseIcon,
  LogoMark,
  SparkleIcon,
  ToothIcon,
  UsersIcon,
  VideoIcon,
} from '@/components/icons';
import { StoreBadges } from '@/components/site-chrome';

/**
 * Public landing page.
 *
 * Every claim here is one the built product actually delivers. In particular it
 * does NOT promise appointment reminders (Phase 11 is unbuilt — no cron route,
 * no push_tokens table) or anything payment-related (there is no billing code
 * anywhere). Adding a claim here means adding the feature first.
 *
 * The three device shots are imported, not referenced by URL. That is what
 * makes them cache-proof: the bundler content-hashes the filename, so replacing
 * a PNG changes its URL and no browser can serve a stale one. It also means the
 * intrinsic size comes from the file, so a re-export of a different size needs
 * no code change.
 *
 * They are exported with transparent backgrounds and no baked shadow, which is
 * why they sit straight on the page wash. An opaque export would show as a
 * rectangle.
 */

const FEATURES = [
  {
    icon: <CalendarIcon />,
    title: 'Book without calling',
    body: 'See the times the practice actually has open and confirm one. No phone call, no callback, no request sitting in a queue.',
  },
  {
    icon: <VideoIcon />,
    title: 'Video consultations',
    body: 'Book a teleconsult and join from your phone five minutes before it starts. For the questions that never needed a drive across town.',
  },
  {
    icon: <ChatIcon />,
    title: 'Message the clinic',
    body: 'One secure conversation with the practice, with photos when a picture explains it faster. Replies come from the clinic team.',
  },
  {
    icon: <ClipboardIcon />,
    title: 'Intake, once',
    body: 'Allergies, medications and conditions filled in on your phone instead of on a clipboard — and kept current between visits.',
  },
  {
    icon: <HeartPulseIcon />,
    title: 'Aftercare that stays put',
    body: 'Post-op instructions from your visit live in the app. No more calling at 11pm to ask what you were told this morning.',
  },
  {
    icon: <UsersIcon />,
    title: 'The whole household',
    body: 'Add profiles for your children or anyone in your care, and book for any of them from your own account.',
  },
];

const STEPS = [
  {
    n: '1',
    title: 'Sign in',
    body: 'With Apple or Google. No password to invent, and none for us to lose.',
  },
  {
    n: '2',
    title: 'Tell us about you',
    body: 'Four short screens. Medical history is optional and can wait until you have a minute.',
  },
  {
    n: '3',
    title: 'Pick a real time',
    body: 'Live openings from the practice calendar. Confirm, and it is booked — instantly, no approval step.',
  },
];

export default function Landing() {
  return (
    <main className="overflow-x-clip">
      {/* ---------- hero ---------- */}
      <section className="mx-auto max-w-6xl px-5 pt-12 sm:px-8 sm:pt-16">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-6">
          <div className="max-w-[660px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white px-3.5 py-1.5 text-[13px] font-semibold text-aqua-ink">
              <ToothIcon width={15} height={15} />
              Patient app for DentaCare Clinic
            </span>

            <h1 className="mt-6 text-[33px] leading-[1.08] font-bold tracking-[-0.03em] text-navy sm:text-[52px] sm:leading-[1.05] sm:tracking-[-0.035em]">
              Care for your smile,
              <br />
              without{' '}
              <span className="whitespace-nowrap text-aqua-ink">the phone call.</span>
            </h1>

            <p className="mt-6 text-[17.5px] leading-relaxed text-muted">
              Real appointment times, your medical history, secure messaging with the clinic and
              video consultations — in one app. Booking, intake and follow-up, without the
              clipboard.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <StoreBadges />
            </div>

            <p className="mt-5 text-[13.5px] text-muted">
              Free to use. Treatment is billed by the practice, never in the app.
            </p>
          </div>

          <Showcase
            src={signinHome}
            alt="The Dentify sign-in screen and home screen, showing the next appointment and quick actions"
            priority
            className="lg:-mr-16 lg:scale-[1.12]"
          />
        </div>
      </section>

      {/* ---------- features ---------- */}
      <section id="features" className="mx-auto max-w-6xl px-5 pt-24 sm:px-8 sm:pt-32">
        <SectionHeading
          eyebrow="What it does"
          title="The three things the clinic runs on phone calls for"
          body="Booking, intake and follow-up — plus the consultations that never needed to be in person."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="card p-7 transition-transform hover:-translate-y-0.5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-powder text-aqua-ink">
                {f.icon}
              </span>
              <h3 className="mt-5 text-[17px] font-semibold text-navy">{f.title}</h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-5 pt-24 sm:px-8 sm:pt-32">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <Showcase
            src={threeScreens}
            alt="Sign-in, home and appointments screens from the Dentify app"
            className="lg:scale-[1.06]"
          />

          <div>
            <SectionHeading
              eyebrow="Getting started"
              title="From signed out to booked in under two minutes"
              body="No forms to print, no hold music, no waiting on a callback to know whether Tuesday works."
            />

            <ol className="mt-10 space-y-7">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="btn-aqua flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-bold">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="text-[16.5px] font-semibold text-navy">{s.title}</h3>
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- AI assistant, with its limits stated up front ---------- */}
      <section className="mx-auto max-w-6xl px-5 pt-24 sm:px-8 sm:pt-32">
        <div className="card card-floating overflow-hidden">
          <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-[1fr_0.85fr]">
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-powder text-aqua-ink">
                <SparkleIcon />
              </span>
              <h2 className="mt-5 text-[28px] leading-tight font-bold tracking-tight text-navy">
                An assistant for the questions
                <br className="hidden sm:block" /> that are not worth an appointment
              </h2>
              <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-muted">
                Ask why cold water hurts, how to brush properly, or whether something can wait. You
                get a plain answer and an offer to book if it should be looked at.
              </p>

              <div className="mt-7 rounded-[var(--radius-tile)] border border-hairline bg-powder/50 p-5">
                <h3 className="text-[13px] font-semibold tracking-wide text-muted uppercase">
                  What it will not do
                </h3>
                <ul className="mt-3 space-y-2 text-[14.5px] text-navy">
                  {[
                    'Diagnose you or name a condition as what you have',
                    'Recommend a medication, a dose or a brand',
                    'Read an X-ray, a scan or a photo',
                    'See your records — it has no access to them',
                  ].map((l) => (
                    <li key={l} className="flex gap-2.5">
                      <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                      {l}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-5 text-[13.5px] leading-relaxed text-muted">
                It is general dental education, not a diagnosis and not a substitute for
                professional advice. Ask about swelling, bleeding that will not stop, or trouble
                breathing and it stops answering and tells you to get emergency care.
              </p>
            </div>

            <AssistantPreview />
          </div>
        </div>
      </section>

      {/* ---------- privacy strip ---------- */}
      <section className="mx-auto max-w-6xl px-5 pt-24 sm:px-8 sm:pt-32">
        <div className="card grid gap-8 p-8 sm:p-11 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <LogoMark size={44} />
            <h2 className="mt-5 text-[26px] leading-tight font-bold tracking-tight text-navy">
              Your health information stays with your clinic
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <PrivacyPoint title="Photos stay private">
              Images you upload are stored in a private folder and shown through links that expire.
            </PrivacyPoint>
            <PrivacyPoint title="The assistant never sees your record">
              No name, date of birth, medical history or appointment is sent to the AI provider.
            </PrivacyPoint>
            <PrivacyPoint title="Staff access is logged">
              Opening a patient record or medical history writes an audit entry — who, and when.
            </PrivacyPoint>
            <PrivacyPoint title="Never sold, never used for ads">
              Your information is used to run the app and support your care. Nothing else.
            </PrivacyPoint>
          </div>
          <p className="text-[13.5px] text-muted lg:col-span-2">
            Read the{' '}
            <Link
              href="/privacy"
              className="font-semibold text-aqua-ink underline underline-offset-2"
            >
              Privacy Policy
            </Link>{' '}
            and the{' '}
            <Link
              href="/terms"
              className="font-semibold text-aqua-ink underline underline-offset-2"
            >
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ---------- closing CTA ---------- */}
      <section className="mx-auto max-w-6xl px-5 pt-24 sm:px-8 sm:pt-32">
        <div className="card card-floating relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(680px_320px_at_75%_15%,#8af5ff40,transparent_70%)]"
          />
          <div className="relative grid items-center gap-6 p-10 sm:p-14 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <h2 className="text-[27px] leading-[1.12] font-bold tracking-[-0.025em] text-navy sm:text-[42px]">
                Your next appointment
                <br className="hidden sm:block" /> is three taps away
              </h2>
              <p className="mt-5 max-w-md text-[16px] leading-relaxed text-muted">
                Download the app, sign in with Apple or Google, and pick a time that actually
                exists.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <StoreBadges />
              </div>
            </div>

            <Showcase
              src={signin}
              alt="The Dentify sign-in screen"
              className="mx-auto max-w-[280px] lg:max-w-[330px]"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

/**
 * A device shot. The PNGs are cut to the device with no shadow, and none is
 * added here — deliberately flat. Do not reintroduce a `drop-shadow`.
 */
function Showcase({
  src,
  alt,
  priority,
  className = '',
}: {
  /** A static import — width and height ride along with it. */
  src: StaticImageData;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Image
        src={src}
        alt={alt}
        priority={priority}
        sizes="(max-width: 1024px) 100vw, 620px"
        className="relative h-auto w-full"
      />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="max-w-2xl">
      <span className="text-[12.5px] font-semibold tracking-wide text-aqua-ink uppercase">
        {eyebrow}
      </span>
      <h2 className="mt-3 text-[26px] leading-tight font-bold tracking-[-0.02em] text-navy sm:text-[36px]">
        {title}
      </h2>
      {body ? <p className="mt-4 text-[16px] leading-relaxed text-muted">{body}</p> : null}
    </div>
  );
}

function PrivacyPoint({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-tile)] border border-hairline bg-powder/40 p-5">
      <h3 className="text-[14.5px] font-semibold text-navy">{title}</h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{children}</p>
    </div>
  );
}

/** Two turns of the assistant thread, including the line it always ends on. */
function AssistantPreview() {
  return (
    <div className="flex flex-col justify-center gap-3">
      <Bubble mine>Why does my tooth hurt when I drink something cold?</Bubble>
      <Bubble>
        Cold sensitivity usually comes down to exposed dentine — from worn enamel, a receding gum
        line, or a small area of decay. On its own it is common and not an emergency.
      </Bubble>
      <Bubble>Would you like to book an appointment so someone can take a look?</Bubble>
      <p className="mt-2 px-1 text-[12.5px] leading-relaxed text-muted">
        Example only. For educational purposes, not medical advice.
      </p>
    </div>
  );
}

function Bubble({ children, mine }: { children: React.ReactNode; mine?: boolean }) {
  return (
    <div
      className={
        mine
          ? 'ml-auto max-w-[85%] rounded-[18px] rounded-br-[6px] bg-powder px-4 py-3 text-[14px] leading-relaxed text-navy'
          : 'mr-auto max-w-[90%] rounded-[18px] rounded-bl-[6px] border border-hairline bg-white px-4 py-3 text-[14px] leading-relaxed text-navy'
      }
    >
      {children}
    </div>
  );
}
