import { Suspense } from "react";
import { AuthForm } from "@/components/forms/auth-form";
import { AuthShell } from "@/components/layout/auth-shell";
export default function LoginPage() { return <AuthShell title="Yönetici girişi" note="Yayın akışını yönetmek için admin hesabınızla giriş yapın."><Suspense><AuthForm mode="login" /></Suspense></AuthShell>; }
