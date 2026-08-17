import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { Icon, type IconName } from "./Icon";

/**
 * The single button primitive. Renders a `<button>` unless an `href` is
 * provided, in which case it renders a `<Link>` with identical styling.
 *
 * Design language (design.md §31): 2px radius, `text-btn` label, hairline or
 * solid fills, one red accent, press feedback on the y-axis. The default
 * `md` size is exactly 44px tall so every button meets the touch-target
 * guideline.
 */
export type ButtonVariant = "primary" | "outline" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonBase {
  /** Visual treatment. `link` is a bare editorial text link. */
  variant?: ButtonVariant;
  /** Height scale. Ignored for `variant="link"`. */
  size?: ButtonSize;
  /** Stretch to the full width of the parent. */
  fullWidth?: boolean;
  /** Leading icon. */
  icon?: IconName;
  /** Trailing icon. */
  iconRight?: IconName;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = ButtonBase &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { href?: undefined };

type ButtonAsLink = ButtonBase &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // design.md §36 — primary CTA is a compact dark button; the accent stays a
  // small detail, never a fill.
  primary: "bg-dark text-white hover:bg-foreground",
  outline: "border border-border bg-transparent text-foreground hover:border-muted hover:bg-surface",
  ghost: "bg-transparent text-foreground hover:bg-surface",
  link: "text-foreground hover:text-accent",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 px-4 text-nav",
  md: "h-11 gap-2 px-6 text-btn",
  lg: "h-12 gap-2 px-7 text-btn",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  icon,
  iconRight,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const isLinkVariant = variant === "link";

  const classes = [
    "inline-flex select-none items-center justify-center whitespace-nowrap font-sans transition-colors duration-fast",
    "disabled:pointer-events-none disabled:opacity-40",
    VARIANT_CLASSES[variant],
    isLinkVariant
      ? "h-auto px-0 py-0.5 text-body-sm font-medium"
      : `${SIZE_CLASSES[size]} active:translate-y-px`,
    fullWidth && "w-full",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {icon ? <Icon name={icon} size={18} aria-hidden="true" /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={18} aria-hidden="true" /> : null}
    </>
  );

  if (rest.href) {
    const { href, ...anchorRest } = rest as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...anchorRest}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as ButtonAsButton)}>
      {content}
    </button>
  );
}
