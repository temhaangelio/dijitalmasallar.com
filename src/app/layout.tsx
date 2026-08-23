import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppToaster } from "@/components/ui/toast";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: { default: "diji.news", template: "%s · diji.news" },
  description: "Kısa ve özgün teknoloji notları için yayın yönetim paneli.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body className={geist.variable}>{children}<AppToaster /></body></html>;
}
