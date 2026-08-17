"use client";

import { useDropzone } from "react-dropzone";

/**
 * Full-area file picker. The whole region is a single interactive control:
 * click (or Enter/Space) opens the picker, drag-and-drop works, and pasting
 * an image from the clipboard is accepted. The hidden `<input>` is kept out
 * of the tab order — the region itself carries the accessible name.
 */
export function Dropzone({
  onFiles,
  disabled,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}) {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (accepted) => {
      if (accepted.length) onFiles(accepted);
    },
    disabled,
    multiple: true,
  });

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = Array.from(e.clipboardData?.files ?? []);
    if (pasted.length) {
      e.preventDefault();
      onFiles(pasted);
    }
  };

  return (
    <div
      {...getRootProps({
        onPaste: handlePaste,
      })}
      className={[
        "relative flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-16 text-center transition-colors duration-fast md:py-20",
        isDragActive ? "border-accent bg-surface" : "border-border hover:border-muted",
        disabled ? "pointer-events-none opacity-50" : "",
      ].join(" ")}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Drop files here, click to browse, or paste from the clipboard"
      aria-disabled={disabled}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
    >
      <input {...getInputProps({ tabIndex: -1, "aria-hidden": "true" })} />
      <div className="mb-6 h-[3px] w-10 bg-accent" aria-hidden="true" />
      <p className="text-h3 text-foreground">
        {isDragActive ? "Drop it here" : "Drop your files here"}
      </p>
      <p className="mt-2 text-body-sm text-muted">
        or <span className="text-accent underline underline-offset-2">browse your computer</span> — or
        paste from clipboard
      </p>
      <p className="mt-6 text-[12px] text-muted">
        Word · PDF · PowerPoint · Excel · images · HTML · Markdown · text
      </p>
    </div>
  );
}
