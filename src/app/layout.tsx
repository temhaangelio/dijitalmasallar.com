import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { AppToaster } from "@/components/ui/toast";
import { FontScript, FontSizeScript } from "@/components/features/visitor/font";
import { InstallScript } from "@/components/features/visitor/push";
import { VisitorAnalytics } from "@/components/features/visitor/visitor-analytics";
import { ThemeScript } from "@/components/features/visitor/theme";
import { siteUrl } from "@/lib/seo";

/*
 * `latin-ext` carries ğ, ş, İ, Ğ, Ş — the Turkish letters the `latin` subset leaves out. Without it
 * the browser still finds them, but in a later-loading file, so Turkish words rendered their first
 * frames with a few letters in a fallback face.
 *
 * The reader picks between these three in page settings. The serif and the mono used to be system
 * stacks — Georgia and SF Mono, neither of which exists on Android — so the same setting produced a
 * different typeface on every platform, with no control over its metrics. Both are now real,
 * self-hosted files with the same language coverage as the sans.
 */
const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist", display: "swap" });

// `opsz` is Source Serif's optical-size axis: paired with `font-optical-sizing: auto` it thickens
// hairlines and opens the spacing as the text gets smaller, which is the whole point of choosing a
// serif with an optical axis for body copy.
const sourceSerif = Source_Serif_4({ subsets: ["latin", "latin-ext"], axes: ["opsz"], variable: "--font-reading-serif", display: "swap" });

// `--font-serif` and `--font-mono` are Tailwind's own theme tokens; these keep their own names so
// the `font-mono` utility still means what it means everywhere else in the app.
const geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-reading-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "diji.news", template: "%s · diji.news" },
  description: "Teknoloji, yapay zekâ, bilim ve dijital kültür odaklı kısa ve güncel haber notları.",
  applicationName: "diji.news",
  appleWebApp: { capable: true, title: "diji.news", statusBarStyle: "default" },
  category: "technology",
  creator: "diji.news",
  publisher: "diji.news",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    siteName: "diji.news",
    title: "diji.news",
    description: "Teknoloji, yapay zekâ, bilim ve dijital kültür odaklı kısa ve güncel haber notları.",
    url: "/",
    locale: "en_US",
    alternateLocale: ["tr_TR"],
  },
  twitter: { card: "summary", title: "diji.news", description: "Kısa ve güncel teknoloji, yapay zekâ, bilim ve dijital kültür notları." },
  verification: { google: "I2Kgl2_qfu24MNHBQscd-jvFyhuFIBiaXULF5QOYOaA" },
};

/**
 * The browser chrome follows the visitor theme rather than a single brand colour, so an installed
 * app does not sit under a light status bar while its own page is dark.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#efefef" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // `ThemeScript` sits in <head> so it runs before the first paint and is part of the initial HTML
  // rather than a React-rendered <script>, which React never executes on the client. It stamps
  // `data-visitor-theme` on <html>, an attribute the server render cannot contain — hence
  // `suppressHydrationWarning`. The dark tokens themselves only apply inside `.visitor-page`.
  return (
    <html lang="tr" suppressHydrationWarning>
      <head><ThemeScript /><FontScript /><FontSizeScript /><InstallScript /></head>
      <body className={`${geist.variable} ${sourceSerif.variable} ${geistMono.variable}`}>{children}<AppToaster /><VisitorAnalytics /></body>
    </html>
  );
}
