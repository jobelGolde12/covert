"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Dropzone } from "@/components/convert/Dropzone";
import { QueueItemView } from "@/components/convert/QueueItemView";
import { Button } from "@/components/ui/Button";
import { Field, controlClass } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { runClientConversion } from "@/lib/client-engine/run";
import { conversionsFrom, detectFormat, conversionById, type ConversionDef } from "@/lib/conversions";
import { uploadFile, createJob } from "@/lib/api-client";
import { subscribeJob } from "@/lib/sse";
import { newItemId, useConvertStore } from "@/lib/convert-store";

interface CatalogEntry {
  id: string;
  from: string[];
  to: string;
  engine: string;
  location: "client" | "server";
  category: string;
  label: string;
  shortLabel: string;
  maxSizeMB: number;
  description: string;
}

async function fetchCatalog(): Promise<CatalogEntry[]> {
  const res = await fetch("/api/v1/formats", { cache: "no-store" });
  const json = await res.json();
  return json.data.conversions;
}

const CATEGORY_LABEL: Record<string, string> = {
  "office-to-pdf": "Office → PDF",
  "pdf-to-office": "PDF → Office",
  "office-to-office": "Office → Office",
  "pdf-tools": "PDF tools",
  image: "Images",
  text: "Text",
  web: "Web & text",
};

const STEPS = [
  { n: 1, label: "Drop a file" },
  { n: 2, label: "Choose format" },
  { n: 3, label: "Convert" },
];

export function ConverterWorkspace() {
  const { data: catalog, isLoading, isError, refetch } = useQuery({
    queryKey: ["formats"],
    queryFn: fetchCatalog,
  });
  const searchParams = useSearchParams();
  const presetTool = searchParams.get("tool");

  const [files, setFiles] = useState<File[]>([]);
  const [sourceFormat, setSourceFormat] = useState<string | null>(null);
  const [selectedDefId, setSelectedDefId] = useState<string | null>(null);
  const [options, setOptions] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  const items = useConvertStore((s) => s.items);
  const add = useConvertStore((s) => s.add);
  const update = useConvertStore((s) => s.update);
  const clear = useConvertStore((s) => s.clear);

  const conversions = useMemo(
    () => (sourceFormat && catalog ? conversionsFrom(sourceFormat) : []),
    [sourceFormat, catalog]
  );

  const presetDef = useMemo(() => {
    if (!presetTool || !catalog) return null;
    return catalog.find((c) => c.id === presetTool) ?? null;
  }, [presetTool, catalog]);

  const presetHint = useMemo(() => {
    if (!presetDef) return null;
    const sourceLabel = presetDef.from.map((f) => f.toUpperCase()).join("/");
    return { label: presetDef.shortLabel, accept: sourceLabel };
  }, [presetDef]);

  const selectedDef: ConversionDef | undefined = useMemo(() => {
    const entry = catalog?.find((c) => c.id === selectedDefId);
    if (!entry) return undefined;
    return { ...entry, priceCredits: 1, optionsSchema: undefined } as unknown as ConversionDef;
  }, [catalog, selectedDefId]);

  // pre-select from ?tool= when files arrive with a matching source format
  useEffect(() => {
    if (presetTool && sourceFormat && catalog) {
      const match = catalog.find((c) => c.id === presetTool && c.from.includes(sourceFormat));
      if (match) {
        setSelectedDefId(match.id);
        setError(null);
      } else if (presetDef) {
        setError(
          `This file is ${sourceFormat.toUpperCase()}, but ${presetDef.shortLabel} expects ${presetDef.from.map((f) => f.toUpperCase()).join(" or ")}. Choose a different conversion below.`
        );
      }
    }
  }, [presetTool, sourceFormat, catalog, presetDef]);

  // announce terminal states to screen readers
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    const last = items[items.length - 1];
    if (!last) return;
    if (last.status === "done") setAnnouncement(`${last.label} conversion finished`);
    if (last.status === "error") setAnnouncement(`${last.label} conversion failed`);
  }, [items]);

  const handleFiles = (incoming: File[]) => {
    setError(null);
    const formats = incoming.map((f) => detectFormat(f.name, f.type)).filter(Boolean) as string[];
    const unique = [...new Set(formats)];
    if (unique.length > 1) {
      setError(`All files must share one format to convert together. Found: ${unique.join(", ")}.`);
      return;
    }
    if (unique.length === 1) {
      setSourceFormat(unique[0]);
    }
    setFiles((prev) => [...prev, ...incoming]);
  };

  const removeFile = (index: number) => {
    setError(null);
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    if (next.length === 0) resetSelection();
  };

  const resetSelection = () => {
    setSourceFormat(null);
    setSelectedDefId(null);
    setOptions({});
  };

  const startOver = () => {
    setFiles([]);
    resetSelection();
    setError(null);
  };

  const handleConvert = async () => {
    if (!selectedDef || !files.length) return;
    setError(null);
    setConverting(true);
    try {
      if (selectedDef.location === "client") {
        await convertClient(selectedDef);
      } else {
        await convertServer(selectedDef);
      }
    } finally {
      setConverting(false);
    }
  };

  const convertClient = async (def: ConversionDef) => {
    const itemId = newItemId();
    add({
      id: itemId,
      defId: def.id,
      label: def.shortLabel,
      location: "client",
      fileName: files.map((f) => f.name).join(", "),
      status: "processing",
      progress: 0,
    });
    try {
      const result = await runClientConversion(def, files, options, (p, stage) =>
        update(itemId, { progress: p, stage })
      );
      const downloadUrls = result.names.map((name, i) => ({
        name,
        url: URL.createObjectURL(result.blobs[i]),
      }));
      update(itemId, {
        status: "done",
        progress: 100,
        result: { blobs: result.blobs, names: result.names, mimes: result.mimes, downloadUrls },
      });
    } catch (err) {
      update(itemId, { status: "error", error: err instanceof Error ? err.message : "Conversion failed" });
    }
  };

  const convertServer = async (def: ConversionDef) => {
    for (const file of files) {
      const itemId = newItemId();
      add({
        id: itemId,
        defId: def.id,
        label: def.shortLabel,
        location: "server",
        fileName: file.name,
        status: "uploading",
        progress: 0,
        stage: "Uploading",
      });
      try {
        const fileId = await uploadFile(file);
        update(itemId, { status: "queued", progress: 5, stage: "Queued" });
        const job = await createJob(fileId, def.to);
        update(itemId, { jobId: job.id, status: "processing", progress: 10, stage: "Queued" });
        subscribeJob(job.id, (j) => {
          update(itemId, { progress: j.progress, stage: j.status === "processing" ? "Converting" : undefined });
          if (j.status === "done") {
            update(itemId, {
              status: "done",
              progress: 100,
              result: {
                blobs: [],
                names: [],
                mimes: [],
                downloadUrls: j.outputs.map((o) => ({ name: o.filename, url: o.downloadUrl })),
              },
            });
          } else if (j.status === "error") {
            update(itemId, {
              status: "error",
              error: j.error?.message ?? "Conversion failed",
              progress: Math.max(j.progress, 10),
            });
          } else if (j.status === "cancelled") {
            update(itemId, { status: "cancelled" });
          }
        });
      } catch (err) {
        update(itemId, { status: "error", error: err instanceof Error ? err.message : "Conversion failed" });
      }
    }
  };

  const formatPickerHidden = !!selectedDefId;
  const currentStep = files.length === 0 ? 1 : selectedDefId ? 3 : formatPickerHidden ? 3 : 2;

  return (
    <div aria-busy={converting}>
      {/* catalog loading skeleton */}
      {isLoading && <CatalogSkeleton />}

      {/* catalog fetch failed */}
      {isError && !isLoading && (
        <div
          role="alert"
          className="flex flex-col items-start gap-4 border border-accent/40 bg-accent/5 p-6"
        >
          <div className="flex items-center gap-2 text-accent">
            <Icon name="alert" size={18} aria-hidden="true" />
            <h2 className="text-body font-medium text-foreground">Couldn&apos;t load the conversion list</h2>
          </div>
          <p className="text-body-sm text-muted">
            The conversion catalogue is unavailable right now. Check your connection and try again.
          </p>
          <Button variant="outline" size="sm" icon="refresh" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* step 1 — dropzone */}
          {files.length === 0 ? (
            <Dropzone onFiles={handleFiles} disabled={converting} hint={presetHint} />
          ) : (
            <div>
              {/* step indicator */}
              <ol
                aria-label="Conversion steps"
                className="mb-6 flex items-center gap-4 overflow-x-auto"
              >
                {STEPS.filter((s) => {
                  if (formatPickerHidden && s.n === 2) return false;
                  return true;
                }).map((s, i) => {
                  const state = currentStep > s.n ? "done" : currentStep === s.n ? "current" : "todo";
                  return (
                    <li key={s.n} className="flex items-center gap-4 whitespace-nowrap">
                      {i > 0 && (
                        <span
                          aria-hidden="true"
                          className={`h-px w-8 sm:w-12 ${currentStep > s.n ? "bg-accent" : "bg-border"}`}
                        />
                      )}
                      <span
                        className={`flex items-center gap-2 ${
                          state === "todo" ? "text-muted" : "text-foreground"
                        }`}
                        aria-current={state === "current" ? "step" : undefined}
                      >
                        <span
                          className={`text-[11px] font-semibold tracking-[0.08em] ${
                            state === "todo" ? "" : "text-accent"
                          }`}
                        >
                          {String(s.n).padStart(2, "0")}
                        </span>
                        <span className="text-nav font-medium">{s.label}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>

              {/* file chips */}
              <div className="flex flex-wrap items-center gap-2">
                {files.map((f, i) => (
                  <span
                    key={`${f.name}-${i}`}
                    className="inline-flex items-center gap-2 border hairline bg-surface px-3 py-2 text-body-sm text-foreground"
                  >
                    <Icon name="file" size={14} aria-hidden="true" className="shrink-0 text-muted" />
                    <span className="max-w-[220px] truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-muted transition-colors duration-fast hover:text-accent"
                      aria-label={`Remove ${f.name}`}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </span>
                ))}
                <Button variant="ghost" size="sm" icon="arrow-left" onClick={startOver}>
                  Start over
                </Button>
              </div>

              {/* error banner */}
              {error && (
                <div
                  role="alert"
                  className="mt-4 flex items-center gap-2 border border-accent/40 bg-accent/5 px-4 py-3 text-body-sm text-accent"
                >
                  <Icon name="alert" size={16} aria-hidden="true" className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* step 2 — format picker (hidden when conversion is pre-selected) */}
              {!selectedDefId && (
                <div className="mt-8">
                  <h2 className="mb-1 text-h3 text-foreground">Choose a format</h2>
                  <p className="mb-5 text-body-sm text-muted">
                    {conversions.length} conversion{conversions.length === 1 ? "" : "s"} available for this
                    file type.
                  </p>
                  {conversions.length === 0 ? (
                    <p className="border border-border bg-surface px-4 py-3 text-body-sm text-muted">
                      No conversions are available for this file type.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
                      {conversions.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedDefId(c.id);
                            setOptions({});
                          }}
                          className="group bg-background p-5 text-left transition-colors duration-fast hover:bg-white"
                          aria-pressed={false}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-body font-medium text-foreground">{c.shortLabel}</span>
                            {c.location === "client" && (
                              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent">
                                On device
                              </span>
                            )}
                          </div>
                          <span className="mt-1 block text-[12px] text-muted">
                            {CATEGORY_LABEL[c.category] ?? c.category}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* step 3 — selected conversion + options */}
              {selectedDef && (
                <>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 border hairline bg-surface px-4 py-2.5 text-body font-medium text-foreground">
                      <Icon name="check" size={14} aria-hidden="true" className="text-accent" />
                      {selectedDef.shortLabel}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDefId(null);
                        setOptions({});
                      }}
                    >
                      Change
                    </Button>
                  </div>
                  <OptionControls defId={selectedDef.id} options={options} setOptions={setOptions} />
                </>
              )}

              {/* step 4 — convert */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button
                  onClick={handleConvert}
                  disabled={!selectedDef || converting}
                  icon={converting ? "spinner" : undefined}
                  size="lg"
                >
                  {converting ? "Converting…" : selectedDef ? `Convert ${selectedDef.shortLabel}` : "Choose a format"}
                </Button>
                {selectedDef?.location === "client" && (
                  <span className="flex items-center gap-1.5 text-[12px] text-muted">
                    <Icon name="device" size={14} aria-hidden="true" />
                    Runs on your device — nothing is uploaded.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* queue */}
          {items.length > 0 && (
            <section className="mt-12" aria-label="Conversion queue">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-h3 text-foreground">Session</h2>
                <Button variant="ghost" size="sm" onClick={clear}>
                  Clear all
                </Button>
              </div>
              <ul className="space-y-3">
                {items.map((item) => (
                  <QueueItemView key={item.id} item={item} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* live region for conversion announcements */}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-border px-6 py-16 text-center md:py-20">
      <Skeleton label="Loading conversion catalogue" className="mb-6 h-[3px] w-10" />
      <Skeleton className="h-7 w-56" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <Skeleton className="mt-6 h-3 w-64 max-w-full" />
    </div>
  );
}

function OptionControls({
  defId,
  options,
  setOptions,
}: {
  defId: string;
  options: Record<string, unknown>;
  setOptions: (o: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) => setOptions({ ...options, [key]: value });

  return (
    <div className="mt-8 max-w-[640px] border hairline bg-surface p-5">
      <h3 className="mb-4 text-body font-medium text-foreground">Options</h3>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {defId === "pdf-rotate" && (
          <>
            <Field label="Angle" htmlFor="opt-angle">
              <select
                id="opt-angle"
                className={controlClass}
                value={(options.angle as string) ?? "90"}
                onChange={(e) => set("angle", e.target.value)}
              >
                <option value="90">90° clockwise</option>
                <option value="180">180°</option>
                <option value="270">90° counter-clockwise</option>
              </select>
            </Field>
            <Field label="Pages" htmlFor="opt-pages" hint="e.g. 1,3,5-7 — leave blank for all">
              <input
                id="opt-pages"
                className={controlClass}
                placeholder="all, or e.g. 1,3,5-7"
                defaultValue=""
                onChange={(e) => set("pages", e.target.value)}
              />
            </Field>
          </>
        )}
        {defId === "pdf-split" && (
          <Field
            label="Page ranges"
            htmlFor="opt-ranges"
            hint="Leave empty to split every page"
            className="sm:col-span-2"
          >
            <input
              id="opt-ranges"
              className={controlClass}
              placeholder="e.g. 1-3, 4-5, 6"
              onChange={(e) => set("ranges", e.target.value)}
            />
          </Field>
        )}
        {defId === "pdf-watermark" && (
          <Field label="Watermark text" htmlFor="opt-text" className="sm:col-span-2">
            <input
              id="opt-text"
              className={controlClass}
              placeholder="DRAFT"
              defaultValue="DRAFT"
              onChange={(e) => set("text", e.target.value)}
            />
          </Field>
        )}
        {defId === "pdf-compress" && (
          <Field label="Compression" htmlFor="opt-level">
            <select
              id="opt-level"
              className={controlClass}
              defaultValue="medium"
              onChange={(e) => set("level", e.target.value)}
            >
              <option value="high">High — smallest size</option>
              <option value="medium">Medium</option>
              <option value="low">Low — best quality</option>
              <option value="lossless">Lossless — keep quality</option>
            </select>
          </Field>
        )}
        {defId === "pdf-image" && (
          <Field label="Image format" htmlFor="opt-imgfmt">
            <select
              id="opt-imgfmt"
              className={controlClass}
              defaultValue="png"
              onChange={(e) => set("format", e.target.value)}
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
            </select>
          </Field>
        )}
        {defId === "pdf-merge" && (
          <p className="text-body-sm text-muted sm:col-span-2">
            Files are merged in the order shown above.
          </p>
        )}
      </div>
    </div>
  );
}
