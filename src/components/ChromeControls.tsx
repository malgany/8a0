"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";
import { locales, normalizeLocale } from "@/lib/i18n";

const langLabels: Record<Locale, string> = { pt: "PT", en: "EN", es: "ES" };
const THEME_STORAGE_KEY = "s80-theme";
const LEGACY_THEME_STORAGE_KEY = "s70-theme";
const STREAMER_STORAGE_KEY = "s80-streamer-mode";
const LEGACY_STREAMER_STORAGE_KEY = "s70-streamer-mode";
const settingsCopy = {
  pt: {
    tech: "Ficha técnica",
    theme: "Tema",
    light: "Claro",
    dark: "Escuro",
    language: "Idioma",
    selectLanguage: "Selecionar idioma",
  },
  en: {
    tech: "Technical info",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    language: "Language",
    selectLanguage: "Select language",
  },
  es: {
    tech: "Ficha técnica",
    theme: "Tema",
    light: "Claro",
    dark: "Oscuro",
    language: "Idioma",
    selectLanguage: "Seleccionar idioma",
  },
} as const;

function pathForLocale(pathname: string, locale: Locale) {
  const parts = pathname.split("/").filter(Boolean);
  const current = locales.includes(parts[0] as Locale) ? (parts.shift() as Locale) : "pt";
  void current;
  if (locale !== "pt") return `/${[locale, ...parts].join("/")}`;
  return `/${parts.join("/")}` || "/";
}

function readStoredTheme() {
  if (typeof window === "undefined") return "theme-panini";
  const stored = localStorage.getItem(THEME_STORAGE_KEY) ?? localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  return stored === "theme-terrace" ? "theme-terrace" : "theme-panini";
}

export function LanguageToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const copy = settingsCopy[locale];
  return (
    <div className="lang-toggle" role="presentation">
      <span className="lang-toggle-val" aria-hidden="true">
        {langLabels[locale]}
      </span>
      <select
        aria-label={copy.selectLanguage}
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
  const [theme, setTheme] = useState(readStoredTheme);
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
        localStorage.setItem(THEME_STORAGE_KEY, next);
        setTheme(next);
      }}
    >
      <span className="tt-label">{theme === "theme-panini" ? "Light" : "Dark"}</span>
    </button>
  );
}

export function SettingsToggle({ locale, label }: { locale: Locale; label: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState(readStoredTheme);
  const router = useRouter();
  const pathname = usePathname();
  const copy = settingsCopy[locale];

  useEffect(() => {
    document.documentElement.classList.remove("theme-panini", "theme-terrace");
    document.documentElement.classList.add(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.remove("streamer-mode");
    localStorage.removeItem(STREAMER_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STREAMER_STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open]);

  return (
    <div className="settings-wrap" ref={wrapRef}>
      <button
        className="theme-toggle settings-btn"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <svg className="settings-ic" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z" />
          <path d="M19.4 13.8c.08-.58.08-1.02 0-1.6l2-1.55-2-3.46-2.5 1a7.12 7.12 0 0 0-1.38-.8L15.15 4h-6.3l-.37 3.38c-.5.2-.96.46-1.38.8l-2.5-1-2 3.46 2 1.55a7.1 7.1 0 0 0 0 1.6l-2 1.56 2 3.46 2.5-1c.42.33.88.6 1.38.8L8.85 22h6.3l.37-3.38c.5-.2.96-.47 1.38-.8l2.5 1 2-3.46-2-1.56Z" />
        </svg>
        <span>{label}</span>
        <span className="settings-caret" aria-hidden="true">
          {"\u25be"}
        </span>
      </button>
      {open ? (
        <div className="settings-menu sticker" role="menu">
          <div className="settings-head">
            <strong>{label}</strong>
            <span>{copy.tech}</span>
          </div>
          <div className="settings-section">
            <span className="settings-label">{copy.theme}</span>
            <div className="settings-row" role="group" aria-label={copy.theme}>
              <button
                className={`settings-choice ${theme === "theme-panini" ? "is-active" : ""}`}
                type="button"
                onClick={() => setTheme("theme-panini")}
              >
                {copy.light}
              </button>
              <button
                className={`settings-choice ${theme === "theme-terrace" ? "is-active" : ""}`}
                type="button"
                onClick={() => setTheme("theme-terrace")}
              >
                {copy.dark}
              </button>
            </div>
          </div>
          <div className="settings-section">
            <span className="settings-label">{copy.language}</span>
            <div className="settings-row settings-row--lang" role="group" aria-label={copy.language}>
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
