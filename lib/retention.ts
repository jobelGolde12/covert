import { env } from "@/lib/env";

/** Retention hours per tier — documentation/security.md §7.1. */
export function retentionHoursFor(userId: string | null): number {
  if (!userId) return env.retentionHours.anon;
  return env.retentionHours.free;
}

export function retentionUntil(userId: string | null): Date {
  return new Date(Date.now() + retentionHoursFor(userId) * 3600_000);
}
