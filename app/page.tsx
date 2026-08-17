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

function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Convert",
    url: "https://convert.app",
    description:
      "Convert Word, PDF, PowerPoint, Excel, images and more — right in your browser. Privacy-first: client-side tools never upload a byte.",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "28+ document conversions",
      "On-device processing for PDF tools",
      "Auto-deleted server conversions",
      "No account required",
      "Privacy-first design",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <Hero />
      <FeatureStrip />
      <ConversionGrid />
      <BrandStory />
      <QuoteCTA />
      <FAQ />
    </>
  );
}
