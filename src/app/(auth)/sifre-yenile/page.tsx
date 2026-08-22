import { AuthForm } from "@/components/forms/auth-form";
import { AuthShell } from "@/components/layout/auth-shell";
import { Suspense } from "react";
export default function ResetPage() { return <AuthShell title="Yeni şifre" note="Hesabınız için güçlü ve benzersiz bir şifre belirleyin."><Suspense><AuthForm mode="reset" /></Suspense></AuthShell>; }
