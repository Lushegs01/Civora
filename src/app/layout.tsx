import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/system/ServiceWorkerRegister";
import { OutboxSync } from "@/components/system/OutboxSync";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Civora — Report safely. Verify carefully. Respond together.",
    template: "%s · Civora"
  },
  description:
    "Civora connects civic reports, evidence, response, and accountability in one traceable workflow.",
  manifest: "/manifest.webmanifest",
  applicationName: "Civora",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  openGraph: {
    title: "Civora — Report safely. Verify carefully. Respond together.",
    description:
      "Civora connects civic reports, evidence, response, and accountability in one traceable workflow.",
    siteName: "Civora",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Civora"
      }
    ]
  },
  robots: { index: false } // demo build — keep out of search indexes
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F4F4F1"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh bg-canvas text-ink">
        {children}
        <ServiceWorkerRegister />
        <OutboxSync />
      </body>
    </html>
  );
}
