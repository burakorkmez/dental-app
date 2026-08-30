import type { ReactNode } from 'react';

/**
 * Web design system — the DentaCare recipe from apps/mobile/design/design-system.png.
 * Every raised surface in the dashboard comes from here, so the two apps stay in sync.
 * See apps/web/design/dashboard-design.png for the target.
 */

export function Card({
  children,
  className = '',
  padding = 'p-6',
}: {
  children: ReactNode;
  className?: string;
  padding?: string;
}) {
  return <section className={`card ${padding} ${className}`}>{children}</section>;
}

/** Card header: aqua-tinted rounded icon tile + title, as in the mockup. */
export function CardTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <header className="mb-5 flex items-center gap-3 border-b border-hairline pb-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-powder text-aqua-ink">
        {icon}
      </span>
      <h2 className="text-[19px] font-semibold tracking-tight text-navy">{children}</h2>
    </header>
  );
}

export function StatTile({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-tile)] border border-hairline bg-powder/70 px-5 py-4">
      <span className="btn-aqua flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
        {icon}
      </span>
      <div className="leading-tight">
        <div className="text-[26px] font-bold text-navy">{value}</div>
        <div className="text-[13px] text-muted">{label}</div>
      </div>
    </div>
  );
}

const STATUS_TONES: Record<string, string> = {
  booked: 'border-aqua/45 bg-aqua/10 text-aqua-ink',
  completed: 'border-success/45 bg-success/10 text-[#1f9d78]',
  cancelled: 'border-slate-300 bg-slate-100 text-slate-500',
  no_show: 'border-coral/45 bg-coral/10 text-[#d8523f]',
  video: 'border-[#9ecdf5] bg-[#e2effc] text-[#2c82d6]',
};

export function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONES[status] ?? STATUS_TONES.cancelled;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-medium capitalize ${tone}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

/** Read-only value chip — allergies, medications, conditions. */
export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-aqua/35 bg-aqua/10 px-3 py-1 text-[13px] font-medium text-aqua-ink">
      {children}
    </span>
  );
}

export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-[15px] font-medium text-navy">{value || '—'}</dd>
    </div>
  );
}

/** A read-only rendering of the mobile toggle rows. */
export function ToggleRow({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[14px] text-navy">{label}</span>
      <span
        className={`flex h-[26px] w-[46px] items-center rounded-full p-[3px] transition-colors ${
          on ? 'btn-aqua justify-end' : 'justify-start bg-[#dce9f4]'
        }`}
      >
        <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
      </span>
    </div>
  );
}

/** Anxiety level, drawn the way the mobile onboarding slider is. */
export function LevelMeter({ value, max = 10 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="relative h-[6px] rounded-full bg-[#dce9f4]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#74D6EC] to-[#0DACC3]"
          style={{ width: `${pct}%` }}
        />
        <span
          className="absolute top-1/2 h-[15px] w-[15px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-aqua shadow-[0_2px_6px_rgba(15,156,184,0.5)]"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[12px] text-muted">
        <span>Low</span>
        <span className="font-medium text-aqua-ink">{value} / {max}</span>
        <span>High</span>
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-tile)] border border-dashed border-hairline bg-white/60 px-5 py-8 text-center text-[14px] text-muted">
      {children}
    </div>
  );
}

/**
 * Dentist headshot with an initials fallback, so a dentist with no photo still
 * renders as a deliberate shape rather than a broken image.
 * ImageKit resizes on delivery — never ship the 1MB original to a 64px slot.
 */
export function Avatar({
  src,
  name,
  size = 64,
}: {
  src: string | null;
  name: string;
  size?: number;
}) {
  const initials = name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();

  if (!src) {
    return (
      <span
        className="btn-aqua flex shrink-0 items-center justify-center rounded-full font-bold"
        style={{ width: size, height: size, fontSize: size * 0.34 }}
      >
        {initials}
      </span>
    );
  }

  const px = size * 2; // retina
  const sep = src.includes('?') ? '&' : '?';

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${src}${sep}tr=w-${px},h-${px},fo-face,q-80`}
      alt={name}
      width={size}
      height={size}
      className="shrink-0 rounded-full border border-hairline object-cover"
      style={{ width: size, height: size }}
    />
  );
}
