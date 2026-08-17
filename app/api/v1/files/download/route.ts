import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { verifyLocalToken } from "@/lib/storage";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/v1/files/download — target URL returned by the local storage
 * adapter for downloads (60 s HMAC token). Production uses R2 presigned GETs.
 */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key") ?? "";
  const exp = Number(request.nextUrl.searchParams.get("exp") ?? "0");
  const token = request.nextUrl.searchParams.get("token") ?? "";

  if (!key || !token || exp < Date.now() / 1000) {
    return apiError("UNAUTHENTICATED", "Download link expired or invalid", 401);
  }
  if (!verifyLocalToken(key, exp, token)) {
    return apiError("UNAUTHENTICATED", "Download link invalid", 401);
  }

  const target = path.join(process.cwd(), "data", "storage", key);
  if (!target.startsWith(path.join(process.cwd(), "data", "storage"))) {
    return apiError("INVALID_REQUEST", "Invalid key", 400);
  }

  // Extract file ID from storage key to look up original filename
  const fileId = key.split("/")[1]; // files/<fileId>/<filename>
  let originalFilename = key.split("/").pop() ?? "download";
  
  if (fileId) {
    const fileRecord = await prisma.file.findUnique({ where: { id: fileId } });
    if (fileRecord) {
      originalFilename = fileRecord.filename;
    }
  }

  try {
    const buf = await fs.readFile(target);
    const mime = mimeFor(originalFilename);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${originalFilename}"`,
        "Content-Length": String(buf.length),
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return apiError("NOT_FOUND", "File not found or expired", 404);
  }
}

function mimeFor(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    html: "text/html",
    txt: "text/plain",
    md: "text/markdown",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
  };
  return map[ext ?? ""] ?? "application/octet-stream";
}
