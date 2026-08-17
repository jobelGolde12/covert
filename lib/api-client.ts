"use client";

/** Small typed client for the Folio API (documentation/api-documentation.md). */

export interface ApiError extends Error {
  code: string;
  status: number;
}

async function parse<T>(res: Response): Promise<T> {
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    const err = (json as { error?: { code?: string; message?: string } })?.error;
    const e = new Error(err?.message ?? `Request failed (${res.status})`) as ApiError;
    e.code = err?.code ?? "INTERNAL";
    e.status = res.status;
    throw e;
  }
  return (json as { data: T }).data;
}

export interface UploadResponse {
  fileId: string;
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  expiresAt: string;
  format: string;
}

export async function requestUpload(filename: string, mimeType: string, sizeBytes: number): Promise<UploadResponse> {
  const res = await fetch("/api/v1/files/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ filename, mimeType, sizeBytes }),
  });
  return parse<UploadResponse>(res);
}

export async function uploadFile(file: File): Promise<string> {
  const req = await requestUpload(file.name, file.type, file.size);
  const putRes = await fetch(req.uploadUrl, {
    method: req.method as "PUT",
    body: file,
    headers: { ...req.headers },
  });
  if (!putRes.ok) throw new Error(`Upload failed (${putRes.status})`);
  const done = await fetch("/api/v1/files/upload/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fileId: req.fileId }),
  });
  const data = await parse<{ fileId: string; status: string }>(done);
  return data.fileId;
}

export interface JobCreateResponse {
  id: string;
  status: string;
  queueMode: "queue" | "inline";
}

export async function createJob(input: string, outputFormat: string): Promise<JobCreateResponse> {
  const res = await fetch("/api/v1/jobs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tasks: [{ operation: "convert", input, outputFormat }] }),
  });
  return parse<JobCreateResponse>(res);
}

export interface JobTask {
  id: string;
  operation: string;
  engine: string | null;
  status: string;
  progress: number;
  error: { code: string; message: string } | null;
}

export interface JobOutput {
  fileId: string;
  filename: string;
  sizeBytes: number;
  downloadUrl: string;
}

export interface Job {
  id: string;
  status: string;
  progress: number;
  error: { code: string; message: string } | null;
  createdAt: string;
  tasks: JobTask[];
  outputs: JobOutput[];
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await fetch(`/api/v1/jobs/${jobId}`, { cache: "no-store" });
  return parse<Job>(res);
}

export async function cancelJob(jobId: string): Promise<void> {
  const res = await fetch(`/api/v1/jobs/${jobId}/cancel`, { method: "POST" });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error((json as { error?: { message?: string } })?.error?.message ?? "Cancel failed");
  }
}
