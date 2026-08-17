import { Hero } from "@/components/home/Hero";
import { ConversionGrid } from "@/components/home/ConversionGrid";
import { BrandStory, FeatureStrip, QuoteCTA, FAQ } from "@/components/home/Sections";

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
