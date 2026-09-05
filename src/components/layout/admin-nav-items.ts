import { Bot, ChartColumn, FileText, LayoutDashboard, Megaphone, Rss } from "lucide-react";

export type AdminModules = Record<"posts" | "ai" | "rss" | "ads" | "analytics", boolean>;
export const adminNavItems = [
  { label: "Genel bakış", href: "/dashboard", module: null, icon: LayoutDashboard },
  { label: "Yazılar", href: "/yazilar", module: "posts", icon: FileText },
  { label: "Yapay zekâ", href: "/yapay-zeka", module: "ai", icon: Bot },
  { label: "RSS", href: "/rss", module: "rss", icon: Rss },
  { label: "Reklamlar", href: "/reklamlar", module: "ads", icon: Megaphone },
  { label: "İstatistik", href: "/istatistik", module: "analytics", icon: ChartColumn },
] as const;
