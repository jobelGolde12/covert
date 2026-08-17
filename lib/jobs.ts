import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { env } from "@/lib/env";
import { uuid } from "@/lib/id";
import { detectFormat, findConversion, extensionFor, type ConversionDef } from "@/lib/conversions";
import { convertWithSoffice, markdownToHtml, OfficeError } from "@/lib/office";
import { retentionUntil } from "@/lib/retention";

/**
 * Job orchestration — documentation/architecture.md §3.2.
 * Used by the API routes (create), the Bull office worker and the inline
 * fallback (process), and the query/cancel routes.
 */

export interface TaskSpec {
  operation: "convert";
  input: string;
  outputFormat: string;
  options?: Record<string, unknown>;
}



export async function createServerJob(tasks: TaskSpec[], opts: { guestId?: string; idempotencyKey?: string } = {}) {
  if (tasks.length !== 1 || tasks[0].operation !== "convert") {
    throw new OfficeError("MVP supports exactly one convert task per job", "INVALID_DATA");
  }
  const spec = tasks[0];
  const file = await prisma.file.findUnique({ where: { id: spec.input } });
  if (!file) throw new OfficeError("Input file not found", "NOT_FOUND");
  if (file.status !== "ready" && file.status !== "done") {
    throw new OfficeError(`Input file is not ready (status: ${file.status})`, "CONFLICT_STATE");
  }

  const source = detectFormat(file.filename, file.mimeType);
  if (!source) throw new OfficeError("Could not detect source format", "UNSUPPORTED_FORMAT");

  const conversion = findConversion(source, spec.outputFormat);
  if (!conversion) {
    throw new OfficeError(`No conversion from ${source} to ${spec.outputFormat}`, "UNSUPPORTED_CONVERSION");
  }
  if (conversion.location !== "server") {
    throw new OfficeError(
      `"${conversion.id}" runs in the browser and never reaches the server`,
      "UNSUPPORTED_CONVERSION"
    );
  }

  const job = await prisma.job.create({
    data: {
      id: uuid(),
      status: "queued",
      idempotencyKey: opts.idempotencyKey ?? null,
      timingsMs: JSON.stringify({ enqueueMs: 0 }),
      tasks: {
        create: [
          {
            id: uuid(),
            operation: "convert",
            engine: conversion.engine,
            engineVersion: "libreoffice-24.2",
            inputFileId: file.id,
            options: spec.options ? JSON.stringify(spec.options) : null,
            status: "waiting",
          },
        ],
      },
    },
    include: { tasks: true },
  });

  return { job, conversion };
}

// ---------------------------------------------------------------------------
// Processing pipeline
// ---------------------------------------------------------------------------

async function readBuffer(storageKey: string): Promise<Buffer> {
  try {
    return await getStorage().getBuffer(storageKey);
  } catch {
    throw new OfficeError("Input file could not be read from storage", "FILE_DELETED");
  }
}

function validateOutput(target: string, buf: Buffer): void {
  if (!buf || buf.length === 0) throw new OfficeError("Engine produced an empty output", "CONVERSION_FAILED");
  const head = buf.subarray(0, 4).toString("latin1");
  if (target === "pdf" && !head.startsWith("%PDF")) {
    throw new OfficeError("Engine produced an invalid PDF", "CONVERSION_FAILED");
  }
  if (["docx", "xlsx", "pptx"].includes(target) && !head.startsWith("PK")) {
    throw new OfficeError(`Engine produced an invalid ${target.toUpperCase()} file`, "CONVERSION_FAILED");
  }
  if (target === "html" && !head.startsWith("<") && !head.startsWith("<!DOCTYPE")) {
    throw new OfficeError("Engine produced an invalid HTML file", "CONVERSION_FAILED");
  }
}

async function setTaskProgress(taskId: string, progress: number) {
  await prisma.task.update({ where: { id: taskId }, data: { progress } }).catch(() => {});
}

/** Full office-conversion pipeline for one job. Runs in the worker or inline. */
export async function processOfficeJob(jobId: string): Promise<void> {
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { tasks: true } });
  if (!job) throw new Error(`Job ${jobId} not found`);
  if (job.status === "cancelled") return;
  if (job.status !== "queued") return;

  const task = job.tasks[0];
  const inputFile = task?.inputFileId ? await prisma.file.findUnique({ where: { id: task.inputFileId } }) : null;
  if (!task || !inputFile) {
    await failJob(jobId, task?.id ?? null, "OPEN_FAILED", "Input file missing");
    return;
  }

  const started = Date.now();
  await prisma.job.update({ where: { id: jobId }, data: { status: "processing", startedAt: new Date() } });
  await prisma.task.update({ where: { id: task.id }, data: { status: "processing", startedAt: new Date(), progress: 10 } });

  const source = detectFormat(inputFile.filename, inputFile.mimeType) ?? "unknown";
  const parsedOptions = parseTaskOptions(task.options);
  const target = parsedOptions?.outputFormat ?? "pdf";
  const conversion = findConversion(source, target);
  if (!conversion) {
    await failJob(jobId, task.id, "UNSUPPORTED_CONVERSION", `No conversion from ${source} to ${target}`);
    return;
  }

  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), `convert-${jobId}-`));
  let outputPath: string | undefined;
  try {
    await setTaskProgress(task.id, 20);
    const inputBuf = await readBuffer(inputFile.storageKey);
    const ext = inputFile.filename.split(".").pop() ?? "bin";
    const inputPath = path.join(tmp, `input.${ext}`);
    await fs.writeFile(inputPath, inputBuf);

    // markdown needs a render step for editorial typography
    if (source === "md" && target === "pdf") {
      const html = markdownToHtml(inputBuf.toString("utf8"));
      const htmlPath = path.join(tmp, "input.html");
      await fs.writeFile(htmlPath, html);
      await setTaskProgress(task.id, 45);
      const res = await convertWithSoffice(htmlPath, path.join(tmp, "out"), target, { timeoutMs: env.lo.timeoutMs });
      outputPath = res.outputPath;
    } else {
      await setTaskProgress(task.id, 45);
      const res = await convertWithSoffice(inputPath, path.join(tmp, "out"), target, { timeoutMs: env.lo.timeoutMs });
      outputPath = res.outputPath;
    }

    await setTaskProgress(task.id, 70);
    const outBuf = await fs.readFile(outputPath!);
    validateOutput(target, outBuf);

    const outId = uuid();
    const storageKey = `files/${outId}/${outId}.${extensionFor(target)}`;
    await getStorage().putBuffer(storageKey, outBuf);
    await setTaskProgress(task.id, 85);

    await prisma.file.create({
      data: {
        id: outId,
        storageKey,
        bucket: "convert-files",
        filename: `${inputFile.filename.replace(/\.[^.]+$/, "")}.${extensionFor(target)}`,
        mimeType: mimeFor(target),
        sizeBytes: outBuf.length,
        checksumSha256: sha256(outBuf),
        status: "done",
        source: "output",
        retentionUntil: retentionUntil(job.userId),
      },
    });

    // Check if job was cancelled during processing
    const currentJob = await prisma.job.findUnique({ where: { id: jobId } });
    if (currentJob?.status === "cancelled") {
      // Clean up the output file we just created
      await prisma.file.delete({ where: { id: outId } }).catch(() => {});
      await fs.rm(outputPath!, { force: true }).catch(() => {});
      return;
    }

    await prisma.task.update({
      where: { id: task.id },
      data: { status: "finished", progress: 100, endedAt: new Date(), outputFileId: outId },
    });
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "done",
        endedAt: new Date(),
        creditsCharged: conversion.priceCredits,
        timingsMs: JSON.stringify({ engineMs: Date.now() - started }),
      },
    });
    await prisma.conversion.create({
      data: {
        userId: job.userId,
        jobId,
        sourceFormat: source,
        targetFormat: target,
        engine: conversion.engine,
        location: conversion.location,
        status: "done",
        inputBytes: inputFile.sizeBytes,
        outputBytes: outBuf.length,
        durationMs: Date.now() - started,
        creditsUsed: conversion.priceCredits,
      },
    });
  } catch (err) {
    const code = err instanceof OfficeError ? err.code : "CONVERSION_FAILED";
    const message = err instanceof Error ? err.message : "Conversion failed";
    await failJob(jobId, task.id, code, message);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
}

function parseTaskOptions(raw: string | null): { outputFormat?: string } | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as { outputFormat?: string };
  } catch {
    return undefined;
  }
}

async function failJob(jobId: string, taskId: string | null, code: string, message: string) {
  if (taskId) {
    await prisma.task
      .update({ where: { id: taskId }, data: { status: "error", errorCode: code, errorMessage: message, endedAt: new Date() } })
      .catch(() => {});
  }
  await prisma.job
    .update({
      where: { id: jobId },
      data: { status: "error", errorCode: code, errorMessage: message.slice(0, 500), endedAt: new Date() },
    })
    .catch(() => {});
}

function mimeFor(target: string): string {
  const map: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    html: "text/html",
    txt: "text/plain",
    md: "text/markdown",
    png: "image/png",
  };
  return map[target] ?? "application/octet-stream";
}

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

// ---------------------------------------------------------------------------
// Query / cancel
// ---------------------------------------------------------------------------

export interface JobApi {
  id: string;
  status: string;
  progress: number;
  error: { code: string; message: string | null } | null;
  creditsCharged: number;
  createdAt: Date;
  startedAt: Date | null;
  endedAt: Date | null;
  tasks: {
    id: string;
    operation: string;
    engine: string | null;
    status: string;
    progress: number;
    error: { code: string; message: string | null } | null;
  }[];
  outputs: {
    fileId: string;
    filename: string;
    sizeBytes: number;
    downloadUrl: string;
    expiresAt: string;
  }[];
}

export async function getJobForApi(jobId: string): Promise<JobApi | null> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { tasks: { include: { input: true, output: true } } },
  });
  if (!job) return null;

  const progress = job.tasks.length
    ? Math.max(...job.tasks.map((t) => t.progress), job.status === "done" ? 100 : 0)
    : job.status === "done"
      ? 100
      : 0;

  const outputs = await Promise.all(
    job.tasks
      .filter((t) => t.outputFileId && t.output)
      .map(async (t) => {
        const out = t.output!;
        return {
          fileId: out.id,
          filename: out.filename,
          sizeBytes: out.sizeBytes,
          downloadUrl: await getStorage().createDownloadUrl(out.storageKey, 60),
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
        };
      })
  );

  return {
    id: job.id,
    status: job.status,
    progress,
    error: job.errorCode
      ? { code: job.errorCode, message: job.errorMessage ?? null }
      : null,
    creditsCharged: job.creditsCharged,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    endedAt: job.endedAt,
    tasks: job.tasks.map((t) => ({
      id: t.id,
      operation: t.operation,
      engine: t.engine,
      status: t.status,
      progress: t.progress,
      error: t.errorCode ? { code: t.errorCode, message: t.errorMessage ?? null } : null,
    })),
    outputs,
  };
}

export async function cancelJob(jobId: string): Promise<boolean> {
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { tasks: true } });
  if (!job) return false;
  if (job.status === "done" || job.status === "error" || job.status === "cancelled") return false;

  const { getQueue } = await import("@/lib/queue");
  getQueue()?.remove(jobId).catch(() => {});

  await prisma.job.update({ where: { id: jobId }, data: { status: "cancelled", endedAt: new Date() } });
  await prisma.task.updateMany({ where: { jobId }, data: { status: "cancelled", endedAt: new Date() } });
  return true;
}
