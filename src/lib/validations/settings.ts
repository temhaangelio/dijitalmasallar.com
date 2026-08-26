import { z } from "zod";

export const settingsSchema = z.object({
  siteName: z.string().trim().min(2, "Site adı en az 2 karakter olmalı.").max(80),
  domain: z.string().trim().min(3, "Alan adını kontrol edin.").max(120),
  description: z.string().trim().min(10, "Açıklama en az 10 karakter olmalı.").max(300),
  descriptionEn: z.string().trim().min(10, "İngilizce açıklama en az 10 karakter olmalı.").max(300),
  aboutText: z.string().trim().min(20, "Hakkında metni en az 20 karakter olmalı.").max(600, "Hakkında metni en fazla 600 karakter olabilir."),
  aboutTextEn: z.string().trim().min(20, "İngilizce hakkında metni en az 20 karakter olmalı.").max(600, "İngilizce hakkında metni en fazla 600 karakter olabilir."),
  language: z.enum(["tr", "en"]),
  feedLayout: z.enum(["short", "card", "classic"]),
  postsPerPage: z.number().int().min(3).max(20),
  contactEmail: z.string().trim().email("Geçerli bir iletişim adresi girin."),
  maintenanceMode: z.boolean(),
  modulePosts: z.boolean(),
  moduleRss: z.boolean(),
  moduleAds: z.boolean(),
  moduleAnalytics: z.boolean(),
  modulePush: z.boolean(),
});
export type SettingsFormValues = z.infer<typeof settingsSchema>;
