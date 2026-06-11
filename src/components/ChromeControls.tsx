"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";
import { locales, normalizeLocale } from "@/lib/i18n";

const langLabels: Record<Locale, string> = { pt: "PT", en: "EN", es: "ES" };

function pathForLocale(pathname: string, locale: Locale) {
  const parts = pathname.split("/").filter(Boolean);
  const current = locales.includes(parts[0] as Locale) ? (parts.shift() as Locale) : "pt";
  void current;
  if (locale !== "pt") return `/${[locale, ...parts].join("/")}`;
  return `/${parts.join("/")}` || "/";
}

export function LanguageToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="lang-toggle" role="presentation">
      <span className="lang-toggle-val" aria-hidden="true">
        {langLabels[locale]}
      </span>
      <select
        aria-label="Select language"
        value={locale}
        onChange={(event) => router.push(pathForLocale(pathname, normalizeLocale(event.target.value)))}
      >
        {locales.map((item) => (
          <option key={item} value={item}>
            {langLabels[item]}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "theme-panini";
    return localStorage.getItem("s70-theme") ?? "theme-panini";
  });
  useEffect(() => {
    document.documentElement.classList.remove("theme-panini", "theme-terrace");
    document.documentElement.classList.add(theme);
  }, [theme]);

  return (
    <button
      className="theme-toggle"
      aria-label="Toggle light/dark theme"
      onClick={() => {
        const next = theme === "theme-panini" ? "theme-terrace" : "theme-panini";
        document.documentElement.classList.remove("theme-panini", "theme-terrace");
        document.documentElement.classList.add(next);
        localStorage.setItem("s70-theme", next);
        setTheme(next);
      }}
    >
      <span className="tt-label">{theme === "theme-panini" ? "Light" : "Dark"}</span>
    </button>
  );
}

export function SettingsToggle({ locale, label }: { locale: Locale; label: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="settings-wrap">
      <button
        className="theme-toggle settings-btn"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {label} <span aria-hidden="true">▾</span>
      </button>
      {open ? (
        <div className="settings-menu sticker" role="menu">
          <div className="settings-row" aria-label="Language">
            {locales.map((item) => (
              <button
                className={`settings-choice ${item === locale ? "is-active" : ""}`}
                key={item}
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(pathForLocale(pathname, item));
                }}
              >
                {langLabels[item]}
              </button>
            ))}
          </div>
          <ThemeToggle />
        </div>
      ) : null}
    </div>
  );
}
