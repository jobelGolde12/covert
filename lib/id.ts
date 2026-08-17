import { randomUUID } from "crypto";

/** URL-safe random id (crypto). */
export function newId(prefix = ""): string {
  return `${prefix}${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function uuid(): string {
  return randomUUID();
}
