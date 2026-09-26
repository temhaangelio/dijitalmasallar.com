import { ChartColumn, FileText, LayoutDashboard, Mail, Megaphone, Rss, Headphones } from "lucide-react";

export type AdminModules = Record<"posts" | "rss" | "ads" | "analytics" | "newsletter", boolean>;
export const adminNavItems = [
  { label: "Genel bakış", href: "/dashboard", module: null, icon: LayoutDashboard },
  { label: "Yazılar", href: "/yazilar", module: "posts", icon: FileText },
  { label: "Podcast", href: "/gunun-ozeti", module: "posts", icon: Headphones },
  { label: "RSS", href: "/rss", module: "rss", icon: Rss },
  { label: "Reklamlar", href: "/reklamlar", module: "ads", icon: Megaphone },
  { label: "E-bülten", href: "/bulten", module: "newsletter", icon: Mail },
  { label: "İstatistik", href: "/istatistik", module: "analytics", icon: ChartColumn },
] as const;
