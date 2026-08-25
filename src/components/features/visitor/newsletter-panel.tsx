import { SubscribeForm } from "@/components/forms/subscribe-form";

/** A compact editorial newsletter row for the About page. */
export function NewsletterPanel({ title, description, language }: { title: string; description: string; language: "tr" | "en" }) {
  return (
    <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_300px] sm:items-end sm:gap-8">
      <div className="min-w-0">
        <h3 className="visitor-heading text-[17px] font-medium leading-[1.35] tracking-[-.015em] text-ink sm:text-[18px]">{title}</h3>
        <p className="visitor-copy mt-2 max-w-[38ch] text-[13px] font-normal leading-[1.6] text-muted">{description}</p>
      </div>
      <SubscribeForm language={language} />
    </div>
  );
}
