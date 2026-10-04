import type { ReactNode, SVGProps } from "react";

/**
 * The handful of glyphs the deck chrome needs, drawn inline so the library
 * carries no icon dependency. Pass your own set through `<Deck icons>`.
 */
function Icon({
  children,
  size = 20,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number; children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

export const ArrowLeftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </Icon>
);
export const ArrowRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </Icon>
);
export const ArrowUpRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </Icon>
);
export const PlayIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 3.5v17l14-8.5z" />
  </Icon>
);
export const EllipsisIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </Icon>
);
export const CloseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icon>
);
export const CopyIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect width="14" height="14" x="8" y="8" rx="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </Icon>
);
export const MaximizeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </Icon>
);
export const MinimizeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
  </Icon>
);
export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </Icon>
);
export const GlobeIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </Icon>
);
export const ImageIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
  </Icon>
);

export const defaultControlIcons = {
  previous: <ArrowLeftIcon />,
  next: <ArrowRightIcon />,
  start: <PlayIcon />,
  menu: <EllipsisIcon />,
  close: <CloseIcon />,
  copy: <CopyIcon />,
  enterFullscreen: <MaximizeIcon />,
  leaveFullscreen: <MinimizeIcon />,
};

/**
 * Glyphs slide items can name with `icon`, so deck data needs no imports.
 * Pass `<Deck icons>` to add names or replace these.
 */
export const slideIcons: Record<string, ReactNode> = {
  link: (
    <Icon strokeWidth={1.5}>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </Icon>
  ),
  phone: (
    <Icon strokeWidth={1.5}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M11 18h2" />
    </Icon>
  ),
  accessibility: (
    <Icon strokeWidth={1.5}>
      <circle cx="12" cy="4.5" r="1.5" />
      <path d="M5 8l7 1.5L19 8M12 9.5V14m0 0-3 6m3-6 3 6" />
    </Icon>
  ),
  keyboard: (
    <Icon strokeWidth={1.5}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
    </Icon>
  ),
  play: (
    <Icon strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="m10 8 6 4-6 4z" />
    </Icon>
  ),
  zap: (
    <Icon strokeWidth={1.5}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9z" />
    </Icon>
  ),
  code: (
    <Icon strokeWidth={1.5}>
      <path d="m8 6-6 6 6 6M16 6l6 6-6 6" />
    </Icon>
  ),
  sliders: (
    <Icon strokeWidth={1.5}>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
    </Icon>
  ),
  image: (
    <Icon strokeWidth={1.5}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3-3-9 9" />
    </Icon>
  ),
  globe: <GlobeIcon strokeWidth={1.5} />,
  users: (
    <Icon strokeWidth={1.5}>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3" />
    </Icon>
  ),
  check: (
    <Icon strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="m8 12 3 3 5-6" />
    </Icon>
  ),
  chart: (
    <Icon strokeWidth={1.5}>
      <path d="M3 3v18h18M7 15l4-4 3 3 6-7" />
    </Icon>
  ),
  lock: (
    <Icon strokeWidth={1.5}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Icon>
  ),
};
