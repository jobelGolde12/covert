import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { verifyLocalToken } from "@/lib/storage";
import { apiError } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 1024 * 1024 * 1024; // 1 GB hard cap

/**
 * PUT /api/v1/files/upload/put — target URL returned by the local storage
 * adapter. Verifies the short-lived HMAC token, then streams the body to disk.
 * Production (R2) uploads go straight to Cloudflare and never hit this route.
 */
export async function PUT(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key") ?? "";
  const exp = Number(request.nextUrl.searchParams.get("exp") ?? "0");
  const token = request.nextUrl.searchParams.get("token") ?? "";

  if (!key || !token || exp < Date.now() / 1000) {
    return apiError("UNAUTHENTICATED", "Upload link expired or invalid", 401);
  }
  if (!verifyLocalToken(key, exp, token)) {
    return apiError("UNAUTHENTICATED", "Upload link invalid", 401);
  }
  if (!request.body) return apiError("INVALID_REQUEST", "Missing body", 400);

  const target = path.join(process.cwd(), "data", "storage", key);
  if (!target.startsWith(path.join(process.cwd(), "data", "storage"))) {
    return apiError("INVALID_REQUEST", "Invalid key", 400);
  }
  await fs.mkdir(path.dirname(target), { recursive: true });

  // stream body to a temp file then rename (atomic-ish)
  const tmp = `${target}.part`;
  const reader = request.body.getReader();
  const handle = await fs.open(tmp, "w");
  let received = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_BYTES) {
        await handle.close();
        await fs.unlink(tmp).catch(() => {});
        return apiError("FILE_TOO_LARGE", "Upload too large", 413);
      }
      await handle.write(value);
    }
    await handle.close();
    await fs.rename(tmp, target);
  } catch (err) {
    await handle.close().catch(() => {});
    await fs.unlink(tmp).catch(() => {});
    return apiError("INTERNAL", err instanceof Error ? err.message : "Upload failed", 500);
  }

  return new NextResponse(null, { status: 204 });
}
