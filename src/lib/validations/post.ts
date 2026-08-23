import { z } from "zod";

const englishPostSchema = z.object({
  title: z.string().trim().max(160),
  excerpt: z.string().trim().max(500),
  body: z.string().trim().min(50, "İçerik en az 50 karakter olmalı."),
});

const turkishPostSchema = z.object({
  title: z.string().trim().max(160),
  excerpt: z.string().trim().max(500),
  body: z.string().trim().min(50, "İçerik en az 50 karakter olmalı."),
});

export const postSchema = z.object({
  tr: turkishPostSchema,
  en: englishPostSchema,
  category: z.string().trim().max(60),
  sourceName: z.string().trim().max(100),
  sourceUrl: z.string().trim().url("Geçerli bir kaynak bağlantısı girin."),
  showTitle: z.boolean(),
  showExcerpt: z.boolean(),
  status: z.enum(["scheduled", "published"]),
  scheduledAt: z.string().optional(),
}).superRefine((value, context) => {
  if (value.showTitle && value.en.title.length < 4) {
    context.addIssue({ code: "custom", path: ["en", "title"], message: "Başlık en az 4 karakter olmalı." });
  }
  if (value.showExcerpt && value.en.excerpt.length < 20) {
    context.addIssue({ code: "custom", path: ["en", "excerpt"], message: "Özet en az 20 karakter olmalı." });
  }
  if (value.status === "scheduled" && (!value.scheduledAt || Number.isNaN(Date.parse(value.scheduledAt)) || new Date(value.scheduledAt) <= new Date())) {
    context.addIssue({ code: "custom", path: ["scheduledAt"], message: "Gelecekte bir yayın tarihi seçin." });
  }
});
export type PostFormValues = z.infer<typeof postSchema>;
