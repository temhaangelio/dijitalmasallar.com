import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalı.").max(80, "Ad soyad en fazla 80 karakter olabilir."),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
