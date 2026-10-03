import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Literata } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { AppToaster } from "@/components/ui/toast";
import { InstallScript } from "@/components/features/visitor/push";
import { VisitorAnalytics } from "@/components/features/visitor/visitor-analytics";
import { GoogleAnalytics } from "@/components/features/visitor/google-analytics";
import { ThemeScript } from "@/components/features/visitor/theme";
import { FontScript } from "@/components/features/visitor/font";
import { siteUrl } from "@/lib/seo";

/** The property the public site reports to. Overridable without a code change, as the domain is. */
const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_ID?.trim() || "G-QPKHW331QX";

/* Shared typography: Atkinson for visitor and admin interfaces, its mono cut for
 * the wordmark. Source Serif remains an optional visitor reading preference.
 * The full local variable fonts include Turkish characters. */
// Local loading avoids Google's missing Atkinson fallback metrics in Turbopack.
const visitorSans = localFont({ src: "./fonts/atkinson-next.ttf", weight: "200 800", style: "normal", variable: "--font-visitor-sans", display: "swap", adjustFontFallback: false, fallback: ["Arial", "sans-serif"] });
const visitorMono = localFont({ src: "./fonts/atkinson-mono.ttf", weight: "200 800", style: "normal", variable: "--font-visitor-mono", display: "swap", adjustFontFallback: false, fallback: ["monospace"] });
// The reading face (Literata, drawn for long reading on screens). The variable keeps its old name so
// every rule that sets the body in the serif picks it up unchanged.
const sourceSerif = Literata({ subsets: ["latin", "latin-ext"], axes: ["opsz"], variable: "--font-source-serif", display: "swap", preload: true, fallback: ["Georgia", "serif"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "dijitalmasallar.com", template: "%s · dijitalmasallar.com" },
  description: "Concise, sourced news notes on technology, artificial intelligence, science, and digital culture.",
  keywords: ["technology news", "artificial intelligence", "science news", "digital culture", "teknoloji haberleri", "yapay zekâ", "bilim"],
  authors: [{ name: "Temha Angelio", url: "https://www.temhaangelio.com/" }],
  applicationName: "dijitalmasallar.com",
  // An opaque status bar prevents iOS standalone mode from compositing the light launch canvas
  // over the top safe area. `black-translucent` produced the grey/white band seen above the app.
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
 * The masthead is an ink band whatever the theme, so the colour behind the phone's status bar is
 * one value and can live here, in <head>, where Safari reads it on its first parse. (It used to be
 * rendered in the body by `VisitorShell`, and Safari never saw it there.)
 */
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Set by `proxy.ts` from `?lang`: English pages say so on <html>, not only on the visitor shell.
  const language = (await headers()).get("x-visitor-language") === "en" ? "en" : "tr";
  // `ThemeScript` sits in <head> so it runs before the first paint and is part of the initial HTML
  // rather than a React-rendered <script>, which React never executes on the client. It stamps
  // `data-visitor-theme` on <html>, an attribute the server render cannot contain — hence
  // `suppressHydrationWarning`. The visitor pages and the admin panel both key their dark tokens off it.
  return (
    <html lang={language} suppressHydrationWarning>
      <head><ThemeScript /><FontScript /><InstallScript /></head>
      <body className={`${visitorSans.variable} ${visitorMono.variable} ${sourceSerif.variable}`}>{children}<AppToaster /><VisitorAnalytics /><GoogleAnalytics id={googleAnalyticsId} /></body>
    </html>
  );
}
