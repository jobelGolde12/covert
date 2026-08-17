import Redis from "ioredis";
import { env } from "@/lib/env";

/**
 * Rate limiting — documentation/api-documentation.md §2, security.md §9.
 * Sliding window per identity (guest cookie / IP / API key).
 * Falls back to an in-memory store when Redis is unreachable (local dev).
 */

let redis: Redis | null = null;
let redisFailed = false;

function getRedis(): Redis | null {
  if (redis) return redis;
  if (redisFailed) return null;
  try {
    redis = new Redis(env.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 1500,
      retryStrategy: () => null, // fail fast, we fall back to memory
    });
    redis.on("error", () => {
      redisFailed = true;
      redis = null;
    });
    return redis;
  } catch {
    redisFailed = true;
    return null;
  }
}

// ---------------------------------------------------------------- in-memory

const mem: Map<string, number[]> = new Map();
function memPrune(key: string, now: number, windowMs: number) {
  const arr = mem.get(key);
  if (!arr) return;
  const cutoff = now - windowMs;
  const kept = arr.filter((t) => t > cutoff);
  if (kept.length) mem.set(key, kept);
  else mem.delete(key);
}

// ------------------------------------------------------------------- public

export interface RateResult {
  ok: boolean;
  remaining: number;
  resetAt: number; // epoch seconds
  limit: number;
}

/** Sliding-window rate check: `limit` events per `windowSeconds`. */
export async function checkRateLimit(
  identity: string,
  windowSeconds: number,
  limit: number
): Promise<RateResult> {
  const now = Date.now();
  const key = `rl:${identity}:${windowSeconds}`;
  const r = getRedis();

  if (r) {
    try {
      const multi = r.multi();
      multi.zremrangebyscore(key, 0, now - windowSeconds * 1000);
      multi.zadd(key, now, `${now}-${Math.random()}`);
      multi.zcard(key);
      multi.pexpire(key, windowSeconds * 1000 + 1000);
      const results = (await multi.exec()) as unknown as [Error | null, unknown][];
      const count = Number(results[2]?.[1] ?? 0);
      const ok = count <= limit;
      return {
        ok,
        remaining: Math.max(0, limit - count),
        resetAt: Math.floor((now + windowSeconds * 1000) / 1000),
        limit,
      };
    } catch {
      /* fall through to memory */
    }
  }

  memPrune(key, now, windowSeconds * 1000);
  const arr = mem.get(key) ?? [];
  arr.push(now);
  mem.set(key, arr);
  const ok = arr.length <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - arr.length),
    resetAt: Math.floor((now + windowSeconds * 1000) / 1000),
    limit,
  };
}

/** Fixed-window daily counter (anonymous conversion quota). */
export async function incrementDaily(identity: string): Promise<{ ok: boolean; remaining: number }> {
  const now = Date.now();
  const day = new Date().toISOString().slice(0, 10);
  const key = `daily:${identity}:${day}`;
  const r = getRedis();

  let count: number;
  if (r) {
    try {
      const res = await r.incr(key);
      if (res === 1) await r.expire(key, 24 * 3600);
      count = res;
    } catch {
      count = (mem.get(key)?.length ?? 0) + 1;
      mem.set(key, [...(mem.get(key) ?? []), now]);
    }
  } else {
    const arr = mem.get(key) ?? [];
    arr.push(now);
    mem.set(key, arr);
    count = arr.length;
  }

  return { ok: count <= env.limits.anonConversionsPerDay, remaining: Math.max(0, env.limits.anonConversionsPerDay - count) };
}

/** Refund a daily quota slot (called when a conversion fails after quota was consumed). */
export async function decrementDaily(identity: string): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  const key = `daily:${identity}:${day}`;
  const r = getRedis();

  if (r) {
    try {
      await r.decr(key);
      return;
    } catch {
      /* fall through to memory */
    }
  }
  const arr = mem.get(key);
  if (arr?.length) arr.pop();
}
