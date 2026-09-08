import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next, IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { AccentScript } from "@/components/features/visitor/accent-script";
import { AppToaster } from "@/components/ui/toast";
import { InstallScript } from "@/components/features/visitor/push";
import { VisitorAnalytics } from "@/components/features/visitor/visitor-analytics";
import { ThemeScript } from "@/components/features/visitor/theme";
import { FontScript } from "@/components/features/visitor/font";
import { siteUrl } from "@/lib/seo";

/*
 * Three families, down from five.
 *
 * Geist was the `body` default, but both shells override it — the visitor pages and the admin panel
 * are Plex Sans — so it was downloaded on every page to set the type in a toast. Montserrat was
 * loaded at weight 800 for two glyphs: the 0 and the 1 inside the brand mark, which are Plex Mono
 * now, the typeface the logotype is already set in.
 *
 * `latin-ext` carries ğ, ş, İ, Ğ, Ş so Turkish never falls back to a second typeface.
 */
/*
 * The public site is set in one family: Atkinson Hyperlegible Next for everything that is read
 * and touched, and its mono cut for the wordmark and the brand's digits. Plex remains for the admin
 * panel alone and is not preloaded, so a reader never downloads it; Source Serif stays as the
 * optional reading face a reader can choose in Settings.
 */
const visitorSans = Atkinson_Hyperlegible_Next({ subsets: ["latin", "latin-ext"], variable: "--font-visitor-sans", display: "swap" });
const visitorMono = Atkinson_Hyperlegible_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-visitor-mono", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin", "latin-ext"], axes: ["opsz"], variable: "--font-source-serif", display: "swap", preload: false });
const plexSans = IBM_Plex_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], variable: "--font-plex-sans", display: "swap", preload: false });
const plexMono = IBM_Plex_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"], variable: "--font-plex-mono", display: "swap", preload: false });

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
      <head><ThemeScript /><FontScript /><AccentScript /><InstallScript /></head>
      <body className={`${visitorSans.variable} ${visitorMono.variable} ${sourceSerif.variable} ${plexSans.variable} ${plexMono.variable}`}>{children}<AppToaster /><VisitorAnalytics /></body>
    </html>
  );
}
