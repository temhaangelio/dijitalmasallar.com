"use client";

import { useState, type ReactNode } from "react";
import { Mail, Users } from "lucide-react";
import { segmentClass, segmentGroupClass } from "@/components/ui/admin-segment";

type Tab = "gonderim" | "alicilar";

/**
 * The two halves of the e-bulletin page, one at a time.
 *
 * Sending an issue and keeping the list are separate jobs done at separate times: one is a morning
 * routine, the other is housekeeping. Stacked on one page each pushed the other off the screen, so
 * they are tabs — the address list is one click away rather than one scroll, and the issue keeps the
 * top of the page where it is acted on.
 *
 * Both panes are rendered on the server and handed in as children, so switching costs nothing and
 * neither pane refetches when it comes back.
 */
export function NewsletterTabs({ send, recipients, recipientCount }: { send: ReactNode; recipients: ReactNode; recipientCount: number }) {
  const [tab, setTab] = useState<Tab>("gonderim");

  const tabs: { value: Tab; label: string; icon: ReactNode; count?: number }[] = [
    { value: "gonderim", label: "Gönderim", icon: <Mail size={15} aria-hidden="true" /> },
    { value: "alicilar", label: "Alıcılar", icon: <Users size={15} aria-hidden="true" />, count: recipientCount },
  ];

  return (
    <>
      <div className="mb-5 flex" role="tablist" aria-label="E-bülten bölümleri">
        <div className={segmentGroupClass}>
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              id={`bulten-sekme-${item.value}`}
              aria-selected={tab === item.value}
              aria-controls={`bulten-panel-${item.value}`}
              onClick={() => setTab(item.value)}
              className={segmentClass(tab === item.value)}
            >
              {item.icon}
              {item.label}
              {item.count === undefined ? null : (
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${tab === item.value ? "bg-surface-3 text-ink-2" : "text-faint"}`}>
                  {item.count.toLocaleString("tr-TR")}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Both panes stay mounted: the issue keeps the day it was left on, and the address list keeps
          its search and filter, which is what makes moving between the two cheap. */}
      <div role="tabpanel" id="bulten-panel-gonderim" aria-labelledby="bulten-sekme-gonderim" hidden={tab !== "gonderim"}>{send}</div>
      <div role="tabpanel" id="bulten-panel-alicilar" aria-labelledby="bulten-sekme-alicilar" hidden={tab !== "alicilar"}>{recipients}</div>
    </>
  );
}
