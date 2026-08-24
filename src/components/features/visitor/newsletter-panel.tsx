import { SubscribeForm } from "@/components/forms/subscribe-form";

/**
 * Shared by the feed and the about page so the two never drift apart. Callers still decide whether
 * the newsletter module is on; this component only renders the panel.
 */
export function NewsletterPanel({ title, description, language }: { title: string; description: string; language: "tr" | "en" }) {
  return (
    <section className="visitor-panel flex flex-col items-stretch justify-between gap-5 rounded-panel bg-ink p-6 text-ink-contrast sm:flex-row sm:items-center sm:gap-8 sm:p-7">
      <div className="min-w-0">
        <h2 className="visitor-heading text-[length:var(--vt-h4)] font-bold tracking-[-.035em]">{title}</h2>
        <p className="visitor-copy mt-1.5 text-[length:var(--vt-ui)] font-medium leading-relaxed text-on-dark [text-wrap:pretty]">{description}</p>
      </div>
      <SubscribeForm language={language} />
    </section>
  );
}
