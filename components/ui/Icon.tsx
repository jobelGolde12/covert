import type { ReactNode, SVGProps } from "react";

/**
 * Shared stroke icon set (24px grid, 1.5px stroke, currentColor).
 * Keep additions to the same visual language: round caps, minimal paths.
 */
export type IconName =
  | "arrow-right"
  | "arrow-left"
  | "close"
  | "download"
  | "spinner"
  | "check"
  | "file"
  | "plus"
  | "chevron-down"
  | "menu"
  | "device"
  | "shield"
  | "alert"
  | "refresh"
  | "lock"
  | "upload";

const PATHS: Record<IconName, ReactNode> = {
  "arrow-right": (
    <>
      <path d="M4 12h16" />
      <path d="m13 5 7 7-7 7" />
    </>
  ),
  "arrow-left": (
    <>
      <path d="M20 12H4" />
      <path d="m11 5-7 7 7 7" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </>
  ),
  spinner: <path d="M12 3a9 9 0 1 0 9 9" />,
  check: <path d="m4 12.5 5.5 5.5L20 6.5" />,
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  menu: (
    <>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </>
  ),
  device: (
    <>
      <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 20h6" />
    </>
  ),
  shield: <path d="M12 3l7 3v5.5c0 4.2-2.8 7.6-7 9.5-4.2-1.9-7-5.3-7-9.5V6z" />,
  alert: (
    <>
      <path d="M12 3 2 20h20z" />
      <path d="M12 9v4" />
      <path d="M12 16.5h.01" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.93-3" />
      <path d="M4 13a8 8 0 0 0 14.93 3" />
      <path d="M5 3v5h5" />
      <path d="M19 21v-5h-5" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="1" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15V3" />
      <path d="m7 8 5-5 5 5" />
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    </>
  ),
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  /** Pixel size; renders as width/height. Defaults to 16. */
  size?: number;
}

export function Icon({ name, size = 16, className = "", ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={name === "spinner" ? `animate-spin ${className}` : className}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
