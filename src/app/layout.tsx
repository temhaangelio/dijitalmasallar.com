import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { AccentScript } from "@/components/features/visitor/accent-script";
import { AppToaster } from "@/components/ui/toast";
import { InstallScript } from "@/components/features/visitor/push";
import { VisitorAnalytics } from "@/components/features/visitor/visitor-analytics";
import { ThemeScript } from "@/components/features/visitor/theme";
import { FontScript } from "@/components/features/visitor/font";
import { FeedViewScript } from "@/components/features/visitor/feed-view-picker";
import { siteUrl } from "@/lib/seo";

/* Shared typography: Atkinson for visitor and admin interfaces, its mono cut for
 * the wordmark. Source Serif remains an optional visitor reading preference.
 * latin-ext includes Turkish characters. */
const visitorSans = Atkinson_Hyperlegible_Next({ subsets: ["latin", "latin-ext"], variable: "--font-visitor-sans", display: "swap" });
const visitorMono = Atkinson_Hyperlegible_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-visitor-mono", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin", "latin-ext"], axes: ["opsz"], variable: "--font-source-serif", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "dijitalmasallar.com", template: "%s · dijitalmasallar.com" },
  description: "Concise, sourced news notes on technology, artificial intelligence, science, and digital culture.",
  keywords: ["technology news", "artificial intelligence", "science news", "digital culture", "teknoloji haberleri", "yapay zekâ", "bilim"],
  authors: [{ name: "Temha Angelio", url: "https://www.temhaangelio.com/" }],
  applicationName: "dijitalmasallar.com",
  appleWebApp: { capable: true, title: "dijitalmasallar.com", statusBarStyle: "black-translucent" },
  category: "technology",
  creator: "dijitalmasallar.com",
  publisher: "dijitalmasallar.com",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    siteName: "dijitalmasallar.com",
    title: "dijitalmasallar.com",
    description: "Concise, sourced news notes on technology, artificial intelligence, science, and digital culture.",
    url: "/",
    locale: "en_US",
    alternateLocale: ["tr_TR"],
  },
  twitter: { card: "summary", title: "dijitalmasallar.com", description: "Concise, sourced news notes on technology, artificial intelligence, science, and digital culture." },
  verification: { google: "I2Kgl2_qfu24MNHBQscd-jvFyhuFIBiaXULF5QOYOaA" },
};

/**
 * `themeColor` is deliberately absent here. It depends on the reader's stored preference, and this
 * export is shared with the always-light admin panel; Next also refuses runtime data in
 * `generateViewport` without making the whole document block on it. `VisitorShell` renders the tag
 * instead, where the cookie is already being read and only the public pages are affected.
 */
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // `ThemeScript` sits in <head> so it runs before the first paint and is part of the initial HTML
  // rather than a React-rendered <script>, which React never executes on the client. It stamps
  // `data-visitor-theme` on <html>, an attribute the server render cannot contain — hence
  // `suppressHydrationWarning`. The dark tokens themselves only apply inside `.visitor-page`.
  return (
    <html lang="tr" suppressHydrationWarning>
      <head><ThemeScript /><FontScript /><AccentScript /><FeedViewScript /><InstallScript /></head>
      <body className={`${visitorSans.variable} ${visitorMono.variable} ${sourceSerif.variable}`}>{children}<AppToaster /><VisitorAnalytics /></body>
    </html>
  );
}
