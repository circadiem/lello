import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 1. PWA & Icon Configuration
export const metadata: Metadata = {
  title: "Lello",
  description: "Family Reading Tracker",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    // We add ?v=2 to force iOS to re-fetch the image
    apple: "/icon.png?v=2", 
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lello",
  },
};

// 2. Prevent zooming on mobile inputs (Quality of Life)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f8fafc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
