import type { Metadata, Viewport } from "next";
import { Geist, IBM_Plex_Mono, IBM_Plex_Sans, Montserrat, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { AppToaster } from "@/components/ui/toast";
import { InstallScript } from "@/components/features/visitor/push";
import { VisitorAnalytics } from "@/components/features/visitor/visitor-analytics";
import { ThemeScript } from "@/components/features/visitor/theme";
import { siteUrl } from "@/lib/seo";

/* `latin-ext` carries ğ, ş, İ, Ğ, Ş so Turkish never falls back to a second typeface. */
const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist", display: "swap" });
const plexSans = IBM_Plex_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], variable: "--font-plex-sans", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"], variable: "--font-plex-mono", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin", "latin-ext"], weight: ["800"], variable: "--font-montserrat", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin", "latin-ext"], axes: ["opsz"], variable: "--font-source-serif", display: "swap" });

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
      <head><ThemeScript /><InstallScript /></head>
      <body className={`${geist.variable} ${plexSans.variable} ${plexMono.variable} ${montserrat.variable} ${sourceSerif.variable}`}>{children}<AppToaster /><VisitorAnalytics /></body>
    </html>
  );
}
