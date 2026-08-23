import { SubscribeForm } from "@/components/forms/subscribe-form";

/**
 * Shared by the feed and the about page so the two never drift apart. Callers still decide whether
 * the newsletter module is on; this component only renders the panel.
 */
export function NewsletterPanel({ title, description }: { title: string; description: string }) {
  return (
    <section className="flex flex-col items-stretch justify-between gap-5 rounded-panel bg-ink p-6 text-ink-contrast sm:flex-row sm:items-center">
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-[-.035em]">{title}</h2>
        <p className="mt-1.5 text-sm font-medium text-on-dark [text-wrap:pretty]">{description}</p>
      </div>
      <SubscribeForm />
    </section>
  );
}
