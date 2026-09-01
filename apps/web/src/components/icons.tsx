import type { SVGProps } from 'react';

/**
 * Inline line icons at the design system's 24px / 1.5px-stroke spec.
 * Inline rather than an icon package — this is the whole set the dashboard uses.
 */
const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const CalendarIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="16" rx="4" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);

export const UsersIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 11a3 3 0 0 0 0-6M17.5 20a5.6 5.6 0 0 0-2-4.3" />
  </svg>
);

export const ToothIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 4.2c-1.5-1-3.2-1.4-4.6-.8C5.6 4.2 5 6.3 5.3 8.6c.3 2 .9 3 1.3 5 .3 1.6.4 3.4.8 4.6.3.9 1.5 1.1 1.9.2.5-1.2.6-3.1.9-4.4.2-.9.6-1.4 1.8-1.4s1.6.5 1.8 1.4c.3 1.3.4 3.2.9 4.4.4.9 1.6.7 1.9-.2.4-1.2.5-3 .8-4.6.4-2 1-3 1.3-5C19 6.3 18.4 4.2 16.6 3.4c-1.4-.6-3.1-.2-4.6.8Z" />
  </svg>
);

export const VideoIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="12" height="12" rx="3.5" />
    <path d="m15 11 5-3v8l-5-3" />
  </svg>
);

export const ClockIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </svg>
);

export const ClipboardIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="5" y="4.5" width="14" height="16" rx="3.5" />
    <path d="M9.5 4.5a2.5 2.5 0 0 1 5 0" />
    <path d="M9 11h6M9 15h4" />
  </svg>
);

export const HeartPulseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 20s-7-4.4-7-9.2A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.8C19 15.6 12 20 12 20Z" />
    <path d="M6 13h3l1.5-2.5L13 15l1.5-2H18" />
  </svg>
);

export const ChatIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20 14.5a3 3 0 0 1-3 3H9l-4 3v-3H7a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3Z" />
    <path d="M9 9h6M9 12.5h4" />
  </svg>
);

export const SparkleIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3.5 13.7 9 19 10.7 13.7 12.4 12 17.9 10.3 12.4 5 10.7 10.3 9 12 3.5Z" />
    <path d="M18 16.5 18.7 18.8 21 19.5 18.7 20.2 18 22.5 17.3 20.2 15 19.5 17.3 18.8 18 16.5Z" />
  </svg>
);

export const ChevronLeftIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m14 6-6 6 6 6" />
  </svg>
);

export const ChevronRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m10 6 6 6-6 6" />
  </svg>
);

export const ArrowLeftIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const LogoutIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M14 20H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7" />
    <path d="M17 15.5 20.5 12 17 8.5M20 12h-9" />
  </svg>
);

/** The tooth-in-shield brand mark from the mockups. */
export const LogoMark = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
    <defs>
      <linearGradient id="dc-shield" x1="24" y1="3" x2="24" y2="45" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8AF5FF" />
        <stop offset="1" stopColor="#24D4DF" />
      </linearGradient>
    </defs>
    <path
      d="M24 3.5 41 9.2v13.4c0 10.5-7 18.6-17 22.1-10-3.5-17-11.6-17-22.1V9.2L24 3.5Z"
      fill="url(#dc-shield)"
      opacity="0.22"
    />
    <path
      d="M24 3.5 41 9.2v13.4c0 10.5-7 18.6-17 22.1-10-3.5-17-11.6-17-22.1V9.2L24 3.5Z"
      stroke="#24D4DF"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M24 15.4c-1.7-1.1-3.6-1.6-5.2-.9-2 .9-2.7 3.2-2.4 5.8.3 2.2 1 3.4 1.5 5.6.3 1.8.4 3.8.9 5.2.3 1 1.7 1.2 2.1.2.6-1.3.7-3.5 1-5 .2-1 .7-1.6 2.1-1.6s1.9.6 2.1 1.6c.3 1.5.4 3.7 1 5 .4 1 1.8.8 2.1-.2.5-1.4.6-3.4.9-5.2.5-2.2 1.2-3.4 1.5-5.6.3-2.6-.4-4.9-2.4-5.8-1.6-.7-3.5-.2-5.2.9Z"
      fill="#fff"
      stroke="#12A2BC"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);
