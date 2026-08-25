import type { Metadata, Viewport } from "next";
import { Geist, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
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
    { media: "(prefers-color-scheme: light)", color: "#f8f8f5" },
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
      <head><ThemeScript /><InstallScript /></head>
      <body className={`${geist.variable} ${plexSans.variable} ${plexMono.variable}`}>{children}<AppToaster /><VisitorAnalytics /></body>
    </html>
  );
}
