"use client";

import Link from "next/link";
import { Check, Languages, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Language = "tr" | "en";
type Theme = "light" | "dark";

const THEME_KEY = "diji-visitor-theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.visitorTheme = theme;
  window.localStorage.setItem(THEME_KEY, theme);
}

export function VisitorThemeSync() {
  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_KEY);
    applyTheme(savedTheme === "dark" ? "dark" : "light");
  }, []);

  return null;
}

export function VisitorPreferences({ language }: { language: Language }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_KEY);
    const initialTheme = savedTheme === "dark" ? "dark" : "light";
    applyTheme(initialTheme);
    queueMicrotask(() => setTheme(initialTheme));
  }, []);

  function selectTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <section className="visitor-panel rounded-[24px] border border-[#e7e7e7] bg-white p-6 sm:p-8">
      <div className="mb-7">
        <h2 className="visitor-heading text-xl font-bold tracking-[-.035em]">
          {language === "en" ? "Preferences" : "Tercihler"}
        </h2>
        <p className="visitor-muted mt-1.5 text-sm font-medium leading-relaxed text-[#777]">
          {language === "en" ? "Customize how the visitor page looks and which language it shows." : "Ziyaretçi sayfasının görünümünü ve içerik dilini seçin."}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="visitor-setting rounded-[20px] border border-[#ececec] bg-[#fafafa] p-4 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-5">
          <div className="flex items-center gap-3.5">
            <span className="visitor-setting-icon grid size-10 shrink-0 place-items-center rounded-[13px] bg-white text-[#0a0a0a] shadow-[0_1px_8px_rgba(0,0,0,.05)]">
              {theme === "dark" ? <Moon size={17} /> : <Sun size={18} />}
            </span>
            <div>
              <h3 className="visitor-heading text-[15px] font-bold">{language === "en" ? "Theme" : "Tema"}</h3>
              <p className="visitor-muted mt-0.5 text-xs font-medium text-[#888]">
                {language === "en" ? "Choose a comfortable appearance." : "Size uygun görünümü seçin."}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-full bg-[#ededed] p-1 sm:mt-0 sm:w-[220px]" role="group" aria-label={language === "en" ? "Theme" : "Tema"}>
            {(["light", "dark"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={theme === value}
                onClick={() => selectTheme(value)}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-all ${theme === value ? "bg-[#0a0a0a] text-white shadow-sm" : "visitor-choice text-[#666] hover:text-black"}`}
              >
                {theme === value && <Check size={13} strokeWidth={2.5} />}
                {value === "light" ? (language === "en" ? "Light" : "Açık") : language === "en" ? "Dark" : "Koyu"}
              </button>
            ))}
          </div>
        </div>

        <div className="visitor-setting rounded-[20px] border border-[#ececec] bg-[#fafafa] p-4 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-5">
          <div className="flex items-center gap-3.5">
            <span className="visitor-setting-icon grid size-10 shrink-0 place-items-center rounded-[13px] bg-white text-[#0a0a0a] shadow-[0_1px_8px_rgba(0,0,0,.05)]">
              <Languages size={18} />
            </span>
            <div>
              <h3 className="visitor-heading text-[15px] font-bold">{language === "en" ? "Language" : "Dil"}</h3>
              <p className="visitor-muted mt-0.5 text-xs font-medium text-[#888]">
                {language === "en" ? "Select the content language." : "İçerik dilini belirleyin."}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-full bg-[#ededed] p-1 sm:mt-0 sm:w-[220px]" role="group" aria-label={language === "en" ? "Language" : "Dil"}>
            <Link href="/hakkinda?lang=tr" aria-current={language === "tr" ? "page" : undefined} className={`flex h-9 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-all ${language === "tr" ? "bg-[#0a0a0a] text-white shadow-sm" : "visitor-choice text-[#666] hover:text-black"}`}>{language === "tr" && <Check size={13} strokeWidth={2.5} />}Türkçe</Link>
            <Link href="/hakkinda?lang=en" aria-current={language === "en" ? "page" : undefined} className={`flex h-9 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-all ${language === "en" ? "bg-[#0a0a0a] text-white shadow-sm" : "visitor-choice text-[#666] hover:text-black"}`}>{language === "en" && <Check size={13} strokeWidth={2.5} />}English</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
