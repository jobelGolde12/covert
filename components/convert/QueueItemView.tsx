"use client";

import { useState } from "react";
import { cancelJob } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { StatusPill, type StatusTone } from "@/components/ui/StatusPill";
import { useConvertStore, type QueueItem } from "@/lib/convert-store";

const STATUS_LABEL: Record<QueueItem["status"], string> = {
  idle: "Ready",
  uploading: "Uploading",
  queued: "Queued",
  processing: "Converting",
  done: "Done",
  error: "Failed",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<QueueItem["status"], StatusTone> = {
  idle: "neutral",
  uploading: "active",
  queued: "active",
  processing: "active",
  done: "success",
  error: "error",
  cancelled: "neutral",
};

export function QueueItemView({ item }: { item: QueueItem }) {
  const update = useConvertStore((s) => s.update);
  const remove = useConvertStore((s) => s.remove);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!item.jobId) return;
    setCancelling(true);
    try {
      await cancelJob(item.jobId);
      update(item.id, { status: "cancelled" });
    } catch {
      setCancelling(false);
    }
  };

  const isBusy = item.status === "uploading" || item.status === "queued" || item.status === "processing";
  const downloads = item.result?.downloadUrls ?? [];

  return (
    <li
      className="border hairline bg-background p-5"
      aria-label={`${item.fileName} — ${STATUS_LABEL[item.status]}`}
      aria-busy={isBusy}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              {item.label}
            </span>
            <StatusPill tone={STATUS_TONE[item.status]}>
              {isBusy && <Icon name="spinner" size={11} aria-hidden="true" />}
              {item.status === "done" && <Icon name="check" size={11} aria-hidden="true" />}
              {item.status === "error" && <Icon name="alert" size={11} aria-hidden="true" />}
              {STATUS_LABEL[item.status]}
            </StatusPill>
            {item.location === "client" && (
              <StatusPill tone="neutral">
                <Icon name="device" size={11} aria-hidden="true" />
                On your device
              </StatusPill>
            )}
          </div>
          <p className="mt-1 flex items-center gap-2 truncate text-body-sm text-foreground">
            <Icon name="file" size={14} aria-hidden="true" className="shrink-0 text-muted" />
            <span className="truncate">{item.fileName}</span>
          </p>
          {item.stage && isBusy && <p className="mt-1 text-[12px] text-muted">{item.stage}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isBusy && item.location === "server" && (
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "Cancelling…" : "Cancel"}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => remove(item.id)} aria-label="Remove from list">
            <Icon name="close" size={14} />
          </Button>
        </div>
      </div>

      {/* progress */}
      <div
        className="mt-3 h-[3px] overflow-hidden bg-border"
        role="progressbar"
        aria-valuenow={item.progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full transition-[width] duration-200 ${item.status === "error" ? "bg-accent" : "bg-foreground"}`}
          style={{ width: `${item.status === "uploading" ? 8 : item.progress}%` }}
        />
      </div>

      {item.status === "done" && downloads.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {downloads.map((d) => (
            <Button key={d.name} variant="primary" size="sm" href={d.url} download={d.name} icon="download">
              Download {d.name}
            </Button>
          ))}
        </div>
      )}

      {item.status === "error" && item.error && (
        <p className="mt-3 flex items-center gap-2 text-body-sm text-accent">
          <Icon name="alert" size={15} aria-hidden="true" className="shrink-0" />
          {item.error}
        </p>
      )}
    </li>
  );
}
