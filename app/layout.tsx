import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import SkipLink from "@/components/SkipLink";
import Analytics from "@/components/Analytics";
import PasswordGate from "@/components/PasswordGate";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Key Insurance Matters | Multi-State Health Insurance Tool",
  description: "Find health insurance for multiple homes. Perfect for snowbirds, remote workers, families. Free 3-minute analysis.",
  keywords: ["health insurance", "multi-state insurance", "snowbird insurance", "multiple homes", "remote worker insurance", "dual residence insurance"],
  authors: [{ name: "Key Insurance Matters" }],
  creator: "Key Insurance Matters",
  publisher: "Key Insurance Matters",
  metadataBase: new URL('https://keyinsurancematters.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Key Insurance Matters | Multi-State Health Insurance Tool",
    description: "Find health insurance for multiple homes. Perfect for snowbirds, remote workers, families. Free 3-minute analysis.",
    url: 'https://keyinsurancematters.com',
    siteName: 'Key Insurance Matters',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Key Insurance Matters - Multi-State Health Insurance',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Key Insurance Matters | Multi-State Health Insurance Tool",
    description: "Find health insurance for multiple homes. Free 3-minute analysis.",
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification when available
    // google: 'your-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Key Insurance Matters",
    "description": "Find health insurance for multiple homes. Perfect for snowbirds, remote workers, and families with multiple residences.",
    "url": "https://keyinsurancematters.com",
    "applicationCategory": "HealthApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Multi-state health insurance recommendations",
      "Medicare and private insurance analysis",
      "Cost comparison across plans",
      "Personalized action items"
    ],
    "browserRequirements": "Requires JavaScript",
    "softwareVersion": "1.0",
    "operatingSystem": "Any"
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={inter.className}>
        <Analytics />
        <PasswordGate>
          <ErrorBoundary>
            <SkipLink targetId="main-content" />
            <Navigation />
            <main id="main-content" className="min-h-screen" tabIndex={-1}>
              {children}
            </main>
            <Footer />
          </ErrorBoundary>
        </PasswordGate>
      </body>
    </html>
  );
}
