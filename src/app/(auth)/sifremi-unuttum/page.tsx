import { AuthForm } from "@/components/forms/auth-form";
import { AuthShell } from "@/components/layout/auth-shell";
import { Suspense } from "react";
export default function ForgotPage() { return <AuthShell title="Şifrenizi yenileyin" note="Bağlantıyı gönderebilmemiz için hesabınızın e-posta adresini yazın."><Suspense><AuthForm mode="forgot" /></Suspense></AuthShell>; }
