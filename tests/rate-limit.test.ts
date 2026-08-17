import { describe, expect, it, vi } from "vitest";
import { checkRateLimit, incrementDaily } from "../lib/rate-limit";

// Tests exercise the in-memory fallback (test REDIS_URL is unroutable).
describe("rate limiting", () => {
  it("allows requests within the limit", async () => {
    const identity = `ip:test-${Math.random()}`;
    const r1 = await checkRateLimit(identity, 60, 3);
    expect(r1.ok).toBe(true);
    expect(r1.remaining).toBeGreaterThanOrEqual(2);
  });

  it("rejects once the limit is exceeded", async () => {
    const identity = `ip:test-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      const r = await checkRateLimit(identity, 60, 3);
      expect(r.ok).toBe(true);
    }
    const r4 = await checkRateLimit(identity, 60, 3);
    expect(r4.ok).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it("is independent per identity and window", async () => {
    const a = `ip:test-${Math.random()}`;
    const b = `ip:test-${Math.random()}`;
    await checkRateLimit(a, 60, 1);
    expect((await checkRateLimit(a, 60, 1)).ok).toBe(false);
    expect((await checkRateLimit(b, 60, 1)).ok).toBe(true);
  });

  it("windows expire (fake timers)", async () => {
    vi.useFakeTimers();
    try {
      const identity = `ip:test-${Math.random()}`;
      await checkRateLimit(identity, 5, 1);
      expect((await checkRateLimit(identity, 5, 1)).ok).toBe(false);
      vi.advanceTimersByTime(6000);
      expect((await checkRateLimit(identity, 5, 1)).ok).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("daily counter respects the anonymous quota", async () => {
    const identity = `ip:daily-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect((await incrementDaily(identity)).ok).toBe(true);
    }
    expect((await incrementDaily(identity)).ok).toBe(false);
  });
});
