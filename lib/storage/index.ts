import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";

/**
 * Storage abstraction — see documentation/architecture.md §3.
 * Production uses Cloudflare R2 with presigned URLs; local dev uses the
 * filesystem adapter, which emulates presigned URLs with short-lived
 * HMAC-signed tokens to our own API routes.
 */

export interface UploadUrl {
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresAt: string;
}

export interface StorageAdapter {
  createUploadUrl(key: string, opts: { mimeType: string; sizeBytes: number }): Promise<UploadUrl>;
  completeUpload(key: string): Promise<{ exists: boolean; sizeBytes: number; checksumSha256: string }>;
  createDownloadUrl(key: string, ttlSeconds?: number): Promise<string>;
  getBuffer(key: string): Promise<Buffer>;
  putBuffer(key: string, buffer: Buffer): Promise<void>;
  deleteObject(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Signing (local adapter token)
// ---------------------------------------------------------------------------

export function signLocalToken(key: string, exp: number): string {
  return createHmac("sha256", env.uploadSecret).update(`${key}:${exp}`).digest("hex");
}

export function verifyLocalToken(key: string, exp: number, token: string): boolean {
  const expected = signLocalToken(key, exp);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// Local filesystem adapter
// ---------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";

const LOCAL_ROOT = path.join(process.cwd(), "data", "storage");

function localPath(key: string): string {
  // keys are always "files/<id>/<id>.<ext>" — never user-controlled segments
  if (!/^[a-zA-Z0-9/._-]+$/.test(key)) throw new Error("Invalid storage key");
  const full = path.join(LOCAL_ROOT, key);
  if (!full.startsWith(LOCAL_ROOT)) throw new Error("Storage key escapes root");
  return full;
}

class LocalStorageAdapter implements StorageAdapter {
  async createUploadUrl(key: string, opts: { mimeType: string; sizeBytes: number }): Promise<UploadUrl> {
    const exp = Math.floor(Date.now() / 1000) + 15 * 60;
    const token = signLocalToken(key, exp);
    const base = env.appUrl;
    return {
      uploadUrl: `${base}/api/v1/files/upload/put?key=${encodeURIComponent(key)}&exp=${exp}&token=${token}`,
      method: "PUT",
      headers: { "content-type": opts.mimeType, "x-folio-size": String(opts.sizeBytes) },
      expiresAt: new Date(exp * 1000).toISOString(),
    };
  }

  async completeUpload(key: string) {
    const p = localPath(key);
    try {
      const stat = await fs.stat(p);
      const buf = await fs.readFile(p);
      return { exists: true, sizeBytes: stat.size, checksumSha256: createHash("sha256").update(buf).digest("hex") };
    } catch {
      return { exists: false, sizeBytes: 0, checksumSha256: "" };
    }
  }

  async createDownloadUrl(key: string, ttlSeconds = 60): Promise<string> {
    const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
    const token = signLocalToken(key, exp);
    return `${env.appUrl}/api/v1/files/download?key=${encodeURIComponent(key)}&exp=${exp}&token=${token}`;
  }

  async getBuffer(key: string): Promise<Buffer> {
    return fs.readFile(localPath(key));
  }

  async putBuffer(key: string, buffer: Buffer): Promise<void> {
    const p = localPath(key);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, buffer);
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await fs.unlink(localPath(key));
    } catch {
      /* already gone */
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(localPath(key));
      return true;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Cloudflare R2 adapter (presigned URLs via AWS SDK)
// ---------------------------------------------------------------------------

class R2StorageAdapter implements StorageAdapter {
  private client: import("@aws-sdk/client-s3").S3Client;
  private bucket: string;

  constructor() {
    const { S3Client } = require("@aws-sdk/client-s3") as typeof import("@aws-sdk/client-s3");
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.r2.accessKeyId!,
        secretAccessKey: env.r2.secretAccessKey!,
      },
    });
    this.bucket = env.r2.bucket;
  }

  async createUploadUrl(key: string, _opts: { mimeType: string; sizeBytes: number }): Promise<UploadUrl> {
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const url = await getSignedUrl(this.client, new PutObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: 900,
    });
    return {
      uploadUrl: url,
      method: "PUT",
      headers: {},
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
    };
  }

  async completeUpload(key: string) {
    const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
    try {
      const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return {
        exists: true,
        sizeBytes: head.ContentLength ?? 0,
        checksumSha256: (head.ETag ?? "").replace(/"/g, ""),
      };
    } catch {
      return { exists: false, sizeBytes: 0, checksumSha256: "" };
    }
  }

  async createDownloadUrl(key: string, ttlSeconds = 60): Promise<string> {
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: ttlSeconds,
    });
  }

  async getBuffer(key: string): Promise<Buffer> {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return Buffer.from(await res.Body!.transformToByteArray());
  }

  async putBuffer(key: string, buffer: Buffer): Promise<void> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer }));
  }

  async deleteObject(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async exists(key: string): Promise<boolean> {
    const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }
}

let storage: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (storage) return storage;
  storage = env.r2.accountId && env.r2.accessKeyId && env.r2.secretAccessKey
    ? new R2StorageAdapter()
    : new LocalStorageAdapter();
  return storage;
}

export function storageKind(): "r2" | "local" {
  return env.r2.accountId && env.r2.accessKeyId && env.r2.secretAccessKey ? "r2" : "local";
}
