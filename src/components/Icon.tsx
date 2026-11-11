import type { SVGProps } from "react";

/** Tiny stroke-icon set (24x24 viewBox). Decorative by default: pair with a text label or aria-label on the button. */
const PATHS = {
  grip: "M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01",
  up: "m6 15 6-6 6 6",
  down: "m6 9 6 6 6-6",
  copy: "M9 9h10v10H9zM5 15V5h10",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3",
  undo: "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
  redo: "m15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  monitor: "M3 4h18v12H3zM8 20h8M12 16v4",
  phone: "M8 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2",
  plus: "M12 5v14M5 12h14",
  download: "M12 3v12m0 0-4-4m4 4 4-4M5 21h14",
  upload: "M12 15V3m0 0L8 7m4-4 4 4M5 21h14",
  clipboard: "M9 4h6v3H9zM7 5H5v16h14V5h-2",
  check: "m5 12 5 5 9-10",
  layout: "M3 4h18v16H3zM3 10h18M10 10v10",
  moonStar: "M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z",
  system: "M3 5h18v11H3zM8 20h8M12 16v4",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  ...rest
}: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
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
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
