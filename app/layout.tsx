import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Folio — Convert documents with style and substance",
    template: "%s · Folio",
  },
  description:
    "Convert Word, PDF, PowerPoint, Excel, images and more — right in your browser. Browser-side tools keep your files on your device; server conversions are auto-deleted.",
  keywords: ["convert pdf", "pdf to word", "word to pdf", "merge pdf", "split pdf", "pdf tools"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-dark focus:text-white focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <Header />
        <Providers>
          <main id="main" className="flex-1">
            {children}
          </main>
        </Providers>
        <Footer />
      </body>
    </html>
  );
}
