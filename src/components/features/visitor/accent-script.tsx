import { accentAttribute, accentChangedEvent, accentOptions, accentStorageKey, resolveAccentPreference } from "@/lib/visitor-accent";

/** Apply saved colors before paint and keep other tabs in sync, even with settings closed. */
export function AccentScript() {
  const lightDefault = accentOptions.find(option => option.id === resolveAccentPreference(null, "light"))!;
  const darkDefault = accentOptions.find(option => option.id === resolveAccentPreference(null, "dark"))!;
  const defaults = `html:not([${accentAttribute}]) .visitor-page,html[${accentAttribute}="auto"] .visitor-page{--color-accent:${lightDefault.light};--visitor-accent-fill:${lightDefault.light};--visitor-accent-contrast:#ffffff}html[data-visitor-theme="dark"]:not([${accentAttribute}]) .visitor-page,html[data-visitor-theme="dark"][${accentAttribute}="auto"] .visitor-page{--color-accent:${darkDefault.dark};--visitor-accent-fill:${darkDefault.dark};--visitor-accent-contrast:#151515}`;
  const css = defaults + accentOptions.map(option => `html[${accentAttribute}="${option.id}"] .visitor-page{--color-accent:${option.light};--visitor-accent-fill:${option.light};--visitor-accent-contrast:#ffffff}html[data-visitor-theme="dark"][${accentAttribute}="${option.id}"] .visitor-page{--color-accent:${option.dark};--visitor-accent-fill:${option.dark};--visitor-accent-contrast:#151515}`).join("");
  const script = `(function(){var ids=${JSON.stringify(accentOptions.map(option => option.id))};var key=${JSON.stringify(accentStorageKey)};function apply(v){document.documentElement.setAttribute(${JSON.stringify(accentAttribute)},ids.indexOf(v)>=0?v:"auto");window.dispatchEvent(new Event(${JSON.stringify(accentChangedEvent)}));}try{apply(localStorage.getItem(key));}catch(e){apply(null);}window.addEventListener("storage",function(e){if(e.key===key||e.key===null)apply(e.newValue);});})();`;
  return <><style>{css}</style><script dangerouslySetInnerHTML={{ __html: script }} /></>;
}
