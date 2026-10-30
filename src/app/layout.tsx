import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Same self-hosted brand fonts as the website (latin subsets of Archivo and Inter).
const archivo = localFont({
  src: "./fonts/archivo-latin-variable.woff2",
  weight: "500 800",
  variable: "--font-archivo",
  display: "swap",
});
const inter = localFont({
  src: "./fonts/inter-latin-variable.woff2",
  weight: "400 600",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sleeky CMS",
    template: "%s | Sleeky CMS",
  },
  description: "Content management for sleekyprogrammers.com.",
  // The CMS is private: keep it out of search engines.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#070B10",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-ink font-sans text-white">{children}</body>
    </html>
  );
}
