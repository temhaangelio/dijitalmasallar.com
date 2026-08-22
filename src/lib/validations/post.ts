import { z } from "zod";

const localizedPostSchema = z.object({
  title: z.string().trim().min(4, "Başlık en az 4 karakter olmalı.").max(160),
  excerpt: z.string().trim().min(20, "Özet en az 20 karakter olmalı.").max(500),
  body: z.string().trim().min(50, "İçerik en az 50 karakter olmalı."),
});

export const postSchema = z.object({
  tr: localizedPostSchema,
  en: localizedPostSchema,
  category: z.string().trim().min(2, "Kategori seçin.").max(60),
  sourceName: z.string().trim().min(2, "Kaynak adı en az 2 karakter olmalı.").max(100),
  sourceUrl: z.string().trim().url("Geçerli bir kaynak bağlantısı girin."),
  showTitle: z.boolean(),
  showExcerpt: z.boolean(),
  status: z.enum(["scheduled", "published"]),
  scheduledAt: z.string().optional(),
}).superRefine((value, context) => {
  if (value.status === "scheduled" && (!value.scheduledAt || Number.isNaN(Date.parse(value.scheduledAt)) || new Date(value.scheduledAt) <= new Date())) {
    context.addIssue({ code: "custom", path: ["scheduledAt"], message: "Gelecekte bir yayın tarihi seçin." });
  }
});
export type PostFormValues = z.infer<typeof postSchema>;
