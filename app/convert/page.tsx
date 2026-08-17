import type { Metadata } from "next";
import { Suspense } from "react";
import { ConverterWorkspace } from "@/components/convert/ConverterWorkspace";

export const metadata: Metadata = {
  title: "Convert documents",
  description:
    "Convert Word, PDF, PowerPoint, Excel, images, HTML and Markdown. Browser-side tools run on your device; server conversions are auto-deleted.",
  alternates: {
    canonical: "/convert",
  },
  openGraph: {
    title: "Convert documents — Convert",
    description:
      "Convert Word, PDF, PowerPoint, Excel, images, HTML and Markdown. Browser-side tools run on your device; server conversions are auto-deleted.",
    type: "website",
  },
};

export default function ConvertPage() {
  return (
    <div className="mx-auto max-w-container px-5 md:px-10 lg:px-16 py-12 md:py-16">
      <div className="max-w-[560px] mb-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-light mb-4">Converter</p>
        <h1 className="text-h1 text-foreground text-balance">Convert your documents.</h1>
        <p className="mt-4 text-body text-muted">
          Drop a file, pick a format. Tools marked{" "}
          <span className="text-accent font-semibold">on device</span> run entirely in your
          browser; everything else is processed securely and deleted automatically.
        </p>
      </div>
      <Suspense fallback={<div className="border-2 border-dashed border-border h-[256px]" aria-hidden="true" />}>
        <ConverterWorkspace />
      </Suspense>
    </div>
  );
}
