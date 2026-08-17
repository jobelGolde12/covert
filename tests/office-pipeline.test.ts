import { describe, expect, it } from "vitest";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { prisma } from "../lib/db";
import { getStorage } from "../lib/storage";
import { convertWithSoffice, markdownToHtml, OfficeError } from "../lib/office";
import { createServerJob, processOfficeJob, getJobForApi, cancelJob } from "../lib/jobs";

function isPdf(buf: Buffer): boolean {
  return buf.subarray(0, 4).toString("latin1") === "%PDF";
}

async function seedFile(opts: { name: string; content: Buffer | string; mime: string }): Promise<string> {
  const content = typeof opts.content === "string" ? Buffer.from(opts.content, "utf8") : opts.content;
  const id = crypto.randomUUID();
  const storageKey = `files/${id}/input${path.extname(opts.name)}`;
  await getStorage().putBuffer(storageKey, content);
  const file = await prisma.file.create({
    data: {
      storageKey,
      filename: opts.name,
      mimeType: opts.mime,
      sizeBytes: content.length,
      status: "ready",
      retentionUntil: new Date(Date.now() + 3600_000),
    },
  });
  return file.id;
}

describe("markdownToHtml", () => {
  it("renders headings, lists, and escapes HTML", () => {
    const html = markdownToHtml("# Hello\n\n- one\n- two\n\n<script>alert(1)</script>");
    expect(html).toContain("<h1>Hello</h1>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>one</li>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("convertWithSoffice (real LibreOffice)", () => {
  it("converts text → PDF", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "folio-test-"));
    try {
      const input = path.join(dir, "input.txt");
      await fs.writeFile(input, "Folio conversion test\n\nLine two of the document.");
      const res = await convertWithSoffice(input, path.join(dir, "out"), "pdf");
      const buf = await fs.readFile(res.outputPath);
      expect(isPdf(buf)).toBe(true);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it("converts markdown → PDF via HTML render", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "folio-test-"));
    try {
      const htmlPath = path.join(dir, "input.html");
      await fs.writeFile(htmlPath, markdownToHtml("# Title\n\nSome body text."));
      const res = await convertWithSoffice(htmlPath, path.join(dir, "out"), "pdf");
      expect(isPdf(await fs.readFile(res.outputPath))).toBe(true);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it("fails cleanly on an unsupported target", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "folio-test-"));
    try {
      const input = path.join(dir, "input.txt");
      await fs.writeFile(input, "hello");
      await expect(convertWithSoffice(input, path.join(dir, "out"), "doesnotexist")).rejects.toThrow(OfficeError);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});

describe("job pipeline (create → process → query → cancel)", () => {
  it("converts a txt file to PDF end-to-end", async () => {
    const fileId = await seedFile({
      name: "hello.txt",
      content: "Folio end-to-end pipeline test.\nSecond line.",
      mime: "text/plain",
    });

    const { job } = await createServerJob([{ operation: "convert", input: fileId, outputFormat: "pdf" }]);
    expect(job.status).toBe("queued");

    await processOfficeJob(job.id);

    const api = (await getJobForApi(job.id))!;
    expect(api.status).toBe("done");
    expect(api.progress).toBe(100);
    expect(api.outputs.length).toBe(1);
    expect(api.outputs[0].filename).toBe("hello.pdf");

    // verify the stored output is a real PDF
    const outFile = await prisma.file.findUnique({ where: { id: api.outputs[0].fileId } });
    const buf = await getStorage().getBuffer(outFile!.storageKey);
    expect(isPdf(buf)).toBe(true);

    // history recorded
    const conv = await prisma.conversion.findFirst({ where: { jobId: job.id } });
    expect(conv?.sourceFormat).toBe("txt");
    expect(conv?.targetFormat).toBe("pdf");
  });

  it("converts docx → pdf (docx produced via LibreOffice)", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "folio-test-"));
    let docxBuf: Buffer;
    try {
      const txt = path.join(dir, "doc.txt");
      await fs.writeFile(txt, "Word document for conversion.");
      const res = await convertWithSoffice(txt, path.join(dir, "out"), "docx");
      docxBuf = await fs.readFile(res.outputPath);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }

    const fileId = await seedFile({
      name: "doc.docx",
      content: docxBuf,
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const { job } = await createServerJob([{ operation: "convert", input: fileId, outputFormat: "pdf" }]);
    await processOfficeJob(job.id);

    const api = (await getJobForApi(job.id))!;
    expect(api.status).toBe("done");
    expect(api.error).toBeNull();
  });

  it("rejects client-side conversions via the API path", async () => {
    const fileId = await seedFile({ name: "a.pdf", content: "%PDF-1.7\n%%EOF", mime: "application/pdf" });
    await expect(
      createServerJob([{ operation: "convert", input: fileId, outputFormat: "pdf" }])
    ).rejects.toThrow(/browser/);
  });

  it("reports engine errors with error codes", async () => {
    // corrupt PDF (passes extension detection, fails to open in LibreOffice)
    const corrupt = Buffer.alloc(2048, 0x00);
    const fileId = await seedFile({ name: "broken.pdf", content: corrupt, mime: "application/pdf" });
    const { job } = await createServerJob([{ operation: "convert", input: fileId, outputFormat: "docx" }]);
    await processOfficeJob(job.id);
    const api = (await getJobForApi(job.id))!;
    expect(api.status).toBe("error");
    expect(api.error?.code).toBeDefined();
  });

  it("cancels a queued job", async () => {
    const fileId = await seedFile({ name: "c.txt", content: "cancel me", mime: "text/plain" });
    const { job } = await createServerJob([{ operation: "convert", input: fileId, outputFormat: "pdf" }]);
    const cancelled = await cancelJob(job.id);
    expect(cancelled).toBe(true);
    // cancelling again is not allowed
    expect(await cancelJob(job.id)).toBe(false);
  });
});
