import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppToaster } from "@/components/ui/toast";
import { ThemeScript } from "@/components/features/visitor/theme";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: { default: "diji.news", template: "%s · diji.news" },
  description: "Kısa ve özgün teknoloji notları için yayın yönetim paneli.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // `ThemeScript` sits in <head> so it runs before the first paint and is part of the initial HTML
  // rather than a React-rendered <script>, which React never executes on the client. It stamps
  // `data-visitor-theme` on <html>, an attribute the server render cannot contain — hence
  // `suppressHydrationWarning`. The dark tokens themselves only apply inside `.visitor-page`.
  return (
    <html lang="tr" suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body className={geist.variable}>{children}<AppToaster /></body>
    </html>
  );
}
