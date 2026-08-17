import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Providers } from "@/components/Providers";
import { CookieBanner } from "@/components/CookieBanner";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Convert — document conversion with style and substance",
    template: "%s · Convert",
  },
  description:
    "Convert Word, PDF, PowerPoint, Excel, images and more — right in your browser. Browser-side tools keep your files on your device; server conversions are auto-deleted.",
  keywords: [
    "convert pdf",
    "pdf to word",
    "word to pdf",
    "merge pdf",
    "split pdf",
    "pdf tools",
    "document conversion",
    "free online converter",
    "privacy-first converter",
  ],
  authors: [{ name: "Convert" }],
  creator: "Convert",
  publisher: "Convert",
  metadataBase: new URL("https://convert.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Convert",
    title: "Convert — Document conversion with style and substance",
    description:
      "Convert Word, PDF, PowerPoint, Excel, images, HTML, Markdown and more — right in your browser. Privacy-first: client-side tools never upload a byte.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Convert — Document conversion platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Convert — Document conversion with style and substance",
    description:
      "Convert Word, PDF, PowerPoint, Excel, images, HTML, Markdown and more — right in your browser. Privacy-first: client-side tools never upload a byte.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className="min-h-screen flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-dark focus:text-white focus:px-4 focus:py-2 focus:rounded"
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
        <CookieBanner />
      </body>
    </html>
  );
}
