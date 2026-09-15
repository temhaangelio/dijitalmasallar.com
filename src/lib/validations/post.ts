import { z } from "zod";

const bodySchema = z.object({ body: z.string().trim().max(30_000, "İçerik en fazla 30.000 karakter olmalı.") });
const sourceSchema = z.string().url().refine(value => /^https?:\/\//i.test(value));

export const postSchema = z.object({
  tr: bodySchema,
  en: bodySchema,
  sourceUrl: z.string().trim().max(2048, "Kaynak bağlantısı çok uzun."),
  status: z.enum(["draft", "scheduled", "published"]),
  scheduledAt: z.string().optional(),
  publishedAt: z.string().optional(),
}).superRefine((value, context) => {
  if (value.status === "draft") {
    if (!value.tr.body && !value.en.body) context.addIssue({ code: "custom", path: ["tr", "body"], message: "Taslak için en az bir dilde içerik girin." });
  } else {
    for (const language of ["tr", "en"] as const) {
      if (value[language].body.length < 50) context.addIssue({ code: "custom", path: [language, "body"], message: "İçerik en az 50 karakter olmalı." });
    }
  }
  if ((value.sourceUrl || value.status !== "draft") && !sourceSchema.safeParse(value.sourceUrl).success) {
    context.addIssue({ code: "custom", path: ["sourceUrl"], message: "Geçerli bir http veya https kaynak bağlantısı girin." });
  }
  if (value.status === "scheduled" && (!value.scheduledAt || Number.isNaN(Date.parse(value.scheduledAt)) || new Date(value.scheduledAt) <= new Date())) {
    context.addIssue({ code: "custom", path: ["scheduledAt"], message: "Gelecekte bir yayın tarihi seçin." });
  }
  if (value.status === "published" && value.publishedAt && (Number.isNaN(Date.parse(value.publishedAt)) || new Date(value.publishedAt) > new Date())) {
    context.addIssue({ code: "custom", path: ["publishedAt"], message: "Geçmiş veya mevcut bir yayın tarihi seçin." });
  }
});
export type PostFormValues = z.infer<typeof postSchema>;
