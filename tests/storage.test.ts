import { describe, expect, it } from "vitest";
import { getStorage, signLocalToken, verifyLocalToken, storageKind } from "../lib/storage";

describe("local storage adapter", () => {
  it("is the local adapter in test env", () => {
    expect(storageKind()).toBe("local");
  });

  it("put/get/delete round trip", async () => {
    const storage = getStorage();
    const key = `files/test-${Date.now()}/out.pdf`;
    await storage.putBuffer(key, Buffer.from("%PDF-1.7 test"));
    expect(await storage.exists(key)).toBe(true);
    const buf = await storage.getBuffer(key);
    expect(buf.toString()).toBe("%PDF-1.7 test");
    await storage.deleteObject(key);
    expect(await storage.exists(key)).toBe(false);
  });

  it("upload URLs verify with HMAC token and reject tampering", async () => {
    const storage = getStorage();
    const upload = await storage.createUploadUrl("files/test-1/a.pdf", { mimeType: "application/pdf", sizeBytes: 10 });
    expect(upload.method).toBe("PUT");
    expect(upload.uploadUrl).toContain("/api/v1/files/upload/put");

    const url = new URL(upload.uploadUrl, "http://localhost");
    const key = url.searchParams.get("key")!;
    const exp = Number(url.searchParams.get("exp")!);
    const token = url.searchParams.get("token")!;
    expect(verifyLocalToken(key, exp, token)).toBe(true);
    expect(verifyLocalToken(key, exp, "forged")).toBe(false);
    expect(verifyLocalToken(key, exp + 100, token)).toBe(false);
    expect(verifyLocalToken("other-key", exp, token)).toBe(false);
  });

  it("download URLs are short-lived signed links", async () => {
    const storage = getStorage();
    const url = await storage.createDownloadUrl("files/test-2/b.pdf", 60);
    expect(url).toContain("/api/v1/files/download");
    const t = signLocalToken("files/test-2/b.pdf", Math.floor(Date.now() / 1000) + 60);
    expect(verifyLocalToken("files/test-2/b.pdf", Math.floor(Date.now() / 1000) + 60, t)).toBe(true);
  });
});
