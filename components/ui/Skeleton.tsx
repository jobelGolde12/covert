/**
 * Shimmer loading placeholder. Renders nothing interactive; the gradient
 * sweep is handled by the `.skeleton` utility and is neutralized under
 * `prefers-reduced-motion`.
 */
interface SkeletonProps {
  className?: string;
  /** Accessible label for screen readers (announced via `role="status"`). */
  label?: string;
}

export function Skeleton({ className = "", label = "Loading" }: SkeletonProps) {
  return <div role="status" aria-label={label} className={`skeleton ${className}`} />;
}
