import { redirect } from "next/navigation";
import { languageHref, resolveVisitorLanguage } from "@/lib/visitor-language";

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const language = resolveVisitorLanguage((await searchParams).lang);
  redirect(languageHref("/about", language));
}
