import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppToaster } from "@/components/ui/toast";
import { FontScript, FontSizeScript } from "@/components/features/visitor/font";
import { VisitorAnalytics } from "@/components/features/visitor/visitor-analytics";
import { ThemeScript } from "@/components/features/visitor/theme";
import { siteUrl } from "@/lib/seo";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

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
      <head><ThemeScript /><FontScript /><FontSizeScript /></head>
      <body className={geist.variable}>{children}<AppToaster /><VisitorAnalytics /></body>
    </html>
  );
}
