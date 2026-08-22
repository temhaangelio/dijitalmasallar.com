import { z } from "zod";

export const newsletterSchema = z.object({
  subject: z.string().trim().min(4, "Konu en az 4 karakter olmalı.").max(160, "Konu en fazla 160 karakter olabilir."),
  previewText: z.string().trim().max(240, "Ön izleme metni en fazla 240 karakter olabilir."),
  content: z.string().trim().min(20, "Bülten içeriği en az 20 karakter olmalı."),
  status: z.enum(["draft", "scheduled"]),
  scheduledAt: z.string().optional(),
}).superRefine((value, context) => {
  if (value.status === "scheduled" && (!value.scheduledAt || Number.isNaN(Date.parse(value.scheduledAt)) || new Date(value.scheduledAt) <= new Date())) {
    context.addIssue({ code: "custom", path: ["scheduledAt"], message: "Gelecekte bir gönderim tarihi seçin." });
  }
});

export type NewsletterFormValues = z.infer<typeof newsletterSchema>;
