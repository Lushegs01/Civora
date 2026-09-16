import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/system/ServiceWorkerRegister";
import { OutboxSync } from "@/components/system/OutboxSync";

export const metadata: Metadata = {
  title: {
    default: "Civora — Report safely. Verify carefully. Respond together.",
    template: "%s · Civora"
  },
  description:
    "Civora is a trusted civic incident platform: report community problems safely, preserve evidence, coordinate response, and transparently track what happens next.",
  manifest: "/manifest.webmanifest",
  applicationName: "Civora",
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
