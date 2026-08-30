import { z } from "zod";

const englishPostSchema = z.object({
  body: z.string().trim().min(50, "İçerik en az 50 karakter olmalı."),
});

const turkishPostSchema = z.object({
  body: z.string().trim().min(50, "İçerik en az 50 karakter olmalı."),
});

export const postSchema = z.object({
  tr: turkishPostSchema,
  en: englishPostSchema,
  sourceUrl: z.string().trim().url("Geçerli bir kaynak bağlantısı girin."),
  featured: z.boolean(),
  aiGeneratedImage: z.boolean(),
  status: z.enum(["scheduled", "published"]),
  scheduledAt: z.string().optional(),
  publishedAt: z.string().optional(),
}).superRefine((value, context) => {
  if (value.status === "scheduled" && (!value.scheduledAt || Number.isNaN(Date.parse(value.scheduledAt)) || new Date(value.scheduledAt) <= new Date())) {
    context.addIssue({ code: "custom", path: ["scheduledAt"], message: "Gelecekte bir yayın tarihi seçin." });
  }
  if (value.status === "published" && value.publishedAt && (Number.isNaN(Date.parse(value.publishedAt)) || new Date(value.publishedAt) > new Date())) {
    context.addIssue({ code: "custom", path: ["publishedAt"], message: "Geçmiş veya mevcut bir yayın tarihi seçin." });
  }
});
export type PostFormValues = z.infer<typeof postSchema>;
