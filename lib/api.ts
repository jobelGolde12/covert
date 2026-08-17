import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { env } from "@/lib/env";
import { checkRateLimit, type RateResult } from "@/lib/rate-limit";

/**
 * API helpers — error envelope per documentation/api-documentation.md §10:
 * { "error": { "code", "message", "details? } }
 */

export function apiJson(data: unknown, init: ResponseInit = {}): NextResponse {
  return NextResponse.json({ data }, init);
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
  init: ResponseInit = {}
): NextResponse {
  return NextResponse.json({ error: { code, message, ...(details ? { details } : {}) } }, { status, ...init });
}

const GUEST_COOKIE = "convert_guest";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export interface Identity {
  guestId: string;
  ip: string;
  setCookie: string | null; // attach to response when newly minted
}

/** Guest identity: persistent random cookie, falling back to IP. */
export function getIdentity(request: NextRequest): Identity {
  const existing = request.cookies.get(GUEST_COOKIE)?.value;
  if (existing && /^[a-f0-9]{32}$/.test(existing)) {
    return { guestId: existing, ip: clientIp(request), setCookie: null };
  }
  const fresh = crypto.randomUUID().replace(/-/g, "");
  const setCookie = `${GUEST_COOKIE}=${fresh}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${env.isProd ? "; Secure" : ""}`;
  return { guestId: fresh, ip: clientIp(request), setCookie };
}

function clientIp(request: NextRequest): string {
  // Never trust X-Forwarded-For or X-Real-IP directly — both are
  // client-controllable headers. Use them only as a last resort for
  // logging/display; rate limiting keys on guestId, not IP.
  return request.headers.get("x-real-ip") ?? "unknown";
}

export interface RateGuard {
  identity: Identity;
  rate: RateResult;
}

/** Rate limit: `reqLimit` requests per `windowSeconds` per identity. */
export async function guardRateLimit(request: NextRequest, opts: { reqLimit?: number; windowSeconds?: number } = {}): Promise<RateGuard | NextResponse> {
  const identity = getIdentity(request);
  const rate = await checkRateLimit(
    `guest:${identity.guestId}`,
    opts.windowSeconds ?? 60,
    opts.reqLimit ?? env.limits.anonReqPerMin
  );
  if (!rate.ok) {
    return apiError("TOO_MANY_REQUESTS", "Rate limit exceeded", 429, undefined, {
      headers: {
        "Retry-After": "60",
        "X-RateLimit-Limit": String(rate.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(rate.resetAt),
      },
    });
  }
  return { identity, rate };
}

export function rateHeaders(rate: RateResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(rate.limit),
    "X-RateLimit-Remaining": String(rate.remaining),
    "X-RateLimit-Reset": String(rate.resetAt),
  };
}

export { randomUUID as uuid };
