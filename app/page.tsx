import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { ConversionGrid } from "@/components/home/ConversionGrid";
import { BrandStory, FeatureStrip, QuoteCTA, FAQ } from "@/components/home/Sections";

export const metadata: Metadata = {
  title: "Convert — Document conversion with style and substance",
  description:
    "Convert Word, PDF, PowerPoint, Excel, images, HTML, Markdown and more — right in your browser. Privacy-first: client-side tools never upload a byte.",
  openGraph: {
    title: "Convert — Document conversion with style and substance",
    description:
      "Convert Word, PDF, PowerPoint, Excel, images, HTML, Markdown and more — right in your browser. Privacy-first: client-side tools never upload a byte.",
    type: "website",
    siteName: "Convert",
  },
  twitter: {
    card: "summary_large_image",
    title: "Convert — Document conversion with style and substance",
    description:
      "Convert Word, PDF, PowerPoint, Excel, images, HTML, Markdown and more — right in your browser. Privacy-first: client-side tools never upload a byte.",
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeatureStrip />
      <ConversionGrid />
      <BrandStory />
      <QuoteCTA />
      <FAQ />
    </>
  );
}
