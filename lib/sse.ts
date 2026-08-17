"use client";

import type { Job } from "@/lib/api-client";

const TERMINAL = new Set(["done", "error", "cancelled"]);

/** Subscribe to job progress via Server-Sent Events. Returns an unsubscribe fn. */
export function subscribeJob(jobId: string, onEvent: (job: Job) => void): () => void {
  const es = new EventSource(`/api/v1/jobs/${jobId}/events`);

  const handler = (e: MessageEvent) => {
    try {
      const job = JSON.parse(e.data) as Job;
      onEvent(job);
      if (TERMINAL.has(job.status)) es.close();
    } catch {
      /* ignore malformed */
    }
  };

  es.addEventListener("job", handler);
  es.onerror = () => {
    // transient — EventSource auto-reconnects; the server closes on terminal state
  };
  return () => es.close();
}
