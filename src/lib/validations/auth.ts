import { z } from "zod";

export const emailSchema = z.string().trim().email("Geçerli bir e-posta adresi girin.");
export const passwordSchema = z.string().min(8, "Şifre en az 8 karakter olmalı.").regex(/[a-zA-Z]/, "Şifre en az bir harf içermeli.").regex(/[0-9]/, "Şifre en az bir rakam içermeli.");
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Şifrenizi girin.") });
export const resetPasswordSchema = z.object({ password: passwordSchema, confirmPassword: z.string() }).refine((data) => data.password === data.confirmPassword, { path: ["confirmPassword"], message: "Şifreler eşleşmiyor." });
