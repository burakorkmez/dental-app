import { Show, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';

import { LogoMark } from '@/components/icons';

/**
 * Nav and footer for the public site — the landing page and the two legal
 * pages. The dashboard has its own chrome and does not use these.
 *
 * The legal links live in both places on purpose: the navbar is what a visitor
 * reaches for, the footer is where an app store reviewer looks.
 */

const LEGAL_LINKS = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
] as const;

/**
 * App-store buttons. Drawn rather than using Apple's and Google's official
 * badge artwork, which has its own brand guidelines and asset files —
 * swap these for the real badges before submitting to either store.
 */
export function StoreBadges({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const big = size === 'lg';
  const shell = big
    ? 'h-[54px] gap-3 px-6 text-[15px]'
    : 'h-[38px] gap-2 px-3.5 text-[12px]';

  return (
    <>
      <a
        href="[APP STORE LINK]"
        className={`flex items-center rounded-2xl bg-navy text-white transition-transform hover:-translate-y-px active:scale-[0.99] ${shell}`}
      >
        <AppleGlyph size={big ? 22 : 16} />
        <span className="text-left leading-none">
          <span className={big ? 'block text-[10.5px] opacity-70' : 'hidden'}>
            Download on the
          </span>
          <span className="block font-semibold">App Store</span>
        </span>
      </a>
      <a
        href="[GOOGLE PLAY LINK]"
        className={`flex items-center rounded-2xl bg-navy text-white transition-transform hover:-translate-y-px active:scale-[0.99] ${shell}`}
      >
        <PlayGlyph size={big ? 20 : 15} />
        <span className="text-left leading-none">
          <span className={big ? 'block text-[10.5px] opacity-70' : 'hidden'}>GET IT ON</span>
          <span className="block font-semibold">Google Play</span>
        </span>
      </a>
    </>
  );
}

function AppleGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.4 12.6c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.8-3.6 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.6.7 2.8.7 1.9-1 2.6-2a9 9 0 0 0 1.2-2.4c-.1 0-2.2-.9-2.2-3.4ZM14.2 5.9c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.7-.9 2.6 1 .1 2-.5 2.6-1.2Z" />
    </svg>
  );
}

function PlayGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M3.6 2.3 14 12 3.6 21.7A1.7 1.7 0 0 1 3 20.4V3.6c0-.5.2-1 .6-1.3Z" fill="#34C79A" />
      <path d="M17.6 8.6 14 12 3.6 2.3c.4-.4 1-.4 1.5-.1l12.5 6.4Z" fill="#8AF5FF" />
      <path d="M17.6 15.4 5.1 21.8c-.5.3-1.1.3-1.5-.1L14 12l3.6 3.4Z" fill="#FF7A6B" />
      <path d="M21.4 10.9c.8.5.8 1.7 0 2.2l-3.8 2.3L14 12l3.6-3.4 3.8 2.3Z" fill="#FFC745" />
    </svg>
  );
}

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <LogoMark size={32} />
      <span className="text-[19px] font-bold tracking-tight text-navy">
        Dent<span className="text-aqua-ink">ify</span>
      </span>
    </Link>
  );
}

export function SiteNav() {
  return (
    <>
      <div className="bg-navy px-5 py-2.5 text-center text-[13px] font-medium text-white/90">
        Booking, secure messaging and video consultations —{' '}
        <span className="text-cyan-glow">free for patients of DentaCare Clinic.</span>
      </div>
      <header className="sticky top-0 z-50 border-b border-hairline/80 bg-page/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Wordmark />

        <div className="ml-auto hidden items-center gap-7 md:flex">
          {[
            { href: '/#features', label: 'Features' },
            { href: '/#how-it-works', label: 'How it works' },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[14.5px] font-medium text-muted transition-colors hover:text-navy"
            >
              {l.label}
            </Link>
          ))}
          {LEGAL_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[14.5px] font-medium text-muted transition-colors hover:text-navy"
            >
              {/* "Terms of Service" is too wide for a navbar; the footer spells it out. */}
              {l.label.replace(' of Service', '').replace(' Policy', '')}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <Show
            when="signed-in"
            fallback={
              <SignInButton mode="modal">
                <button className="hidden text-[14.5px] font-medium text-muted transition-colors hover:text-navy sm:block">
                  Staff sign in
                </button>
              </SignInButton>
            }
          >
            <Link
              href="/dashboard"
              className="btn-glass rounded-full px-5 py-2.5 text-[14.5px] font-semibold transition-transform active:scale-[0.98]"
            >
              Dashboard
            </Link>
          </Show>
          <div className="hidden items-center gap-2 lg:flex">
            <StoreBadges size="sm" />
          </div>
        </div>
      </nav>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-hairline bg-white/60">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              The patient app for DentaCare Clinic. Booking, intake, messaging and video
              consultations — without the phone call.
            </p>
          </div>

          <div className="flex gap-14">
            <FooterColumn title="Legal">
              {LEGAL_LINKS.map((l) => (
                <FooterLink key={l.href} href={l.href}>
                  {l.label}
                </FooterLink>
              ))}
            </FooterColumn>

            <FooterColumn title="Clinic">
              {/* Plain anchors — tel: and mailto: leave the app, so the router
                  has no part to play. */}
              <li>
                <a href="tel:[CLINIC PHONE]" className="text-[14px] text-navy hover:text-aqua-ink">
                  [CLINIC PHONE]
                </a>
              </li>
              <li>
                <a
                  href="mailto:[SUPPORT EMAIL]"
                  className="text-[14px] text-navy hover:text-aqua-ink"
                >
                  [SUPPORT EMAIL]
                </a>
              </li>
            </FooterColumn>
          </div>
        </div>

        {/* The one line that matters most on a health app's footer. */}
        <div className="mt-12 rounded-[var(--radius-tile)] border border-coral/25 bg-coral/[0.06] px-4 py-3 text-[13.5px] font-medium text-navy">
          Not for emergencies. If you have trouble breathing or swallowing, facial swelling, or
          bleeding that will not stop, call 911 or go to your nearest emergency room.
        </div>

        <p className="mt-8 text-[13px] text-muted">
          © {new Date().getFullYear()} [LEGAL ENTITY NAME]. Dentify is scheduling and
          communication software. It does not provide dental advice, diagnosis or treatment.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[12.5px] font-semibold tracking-wide text-muted uppercase">{title}</h3>
      <ul className="mt-3.5 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-[14px] text-navy transition-colors hover:text-aqua-ink"
      >
        {children}
      </Link>
    </li>
  );
}

/**
 * Shell for /terms and /privacy: the title block, the dates, the unmissable
 * draft banner, and the prose column. The pages themselves are then just the
 * document, as semantic HTML styled by the `legal-prose` utility.
 *
 * Delete `draft` from both pages once an attorney has signed the text off.
 */
export function LegalPage({
  title,
  effective,
  updated,
  summary,
  current,
  draft = true,
  children,
}: {
  title: string;
  effective: string;
  updated: string;
  summary: string;
  /** This page's own href, so the cross-link below does not link to itself. */
  current: string;
  draft?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 pt-14 pb-4 sm:px-8 sm:pt-20">
      <h1 className="text-[38px] leading-tight font-bold tracking-[-0.03em] text-navy sm:text-[46px]">
        {title}
      </h1>
      <p className="mt-4 text-[16.5px] leading-relaxed text-muted">{summary}</p>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-[13.5px] text-muted">
        <span>
          Effective <strong className="font-semibold text-navy">{effective}</strong>
        </span>
        <span>
          Last updated <strong className="font-semibold text-navy">{updated}</strong>
        </span>
      </div>

      {draft ? (
        <div className="mt-8 rounded-[var(--radius-tile)] border border-coral/30 bg-coral/[0.07] p-5">
          <h2 className="text-[14px] font-bold text-navy">Draft — not yet in force</h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-navy/80">
            This document is a working draft written from the application&rsquo;s source code. It
            contains unresolved placeholders in square brackets and has not been reviewed by a
            lawyer. It is not yet binding on anyone.
          </p>
        </div>
      ) : null}

      <hr className="mt-10 border-hairline" />

      <div className="legal-prose mt-2">{children}</div>

      <div className="mt-16 rounded-[var(--radius-tile)] border border-hairline bg-white p-6">
        <p className="text-[14.5px] text-muted">
          See also the{' '}
          {LEGAL_LINKS.filter((l) => l.href !== current).map((l, i) => (
            <span key={l.href}>
              {i > 0 ? ' and the ' : ''}
              <Link
                href={l.href}
                className="font-semibold text-aqua-ink underline underline-offset-2"
              >
                {l.label}
              </Link>
            </span>
          ))}
          . Questions about either: <strong className="text-navy">[SUPPORT EMAIL]</strong>.
        </p>
      </div>
    </main>
  );
}
