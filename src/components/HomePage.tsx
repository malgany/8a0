import Link from "next/link";
import type { Locale } from "@/lib/types";
import { localePath, messages } from "@/lib/i18n";
import { SettingsToggle } from "./ChromeControls";
import { PitchMarkings } from "./PitchMarkings";

const previewPlayers = [
  { number: "1", name: "Neuer", left: 50, top: 88, force: 99 },
  { number: "4", name: "C. Alberto", left: 82, top: 70, force: 90 },
  { number: "5", name: "Beckenbauer", left: 60, top: 74, force: 97 },
  { number: "6", name: "Moore", left: 40, top: 74, force: 91 },
  { number: "6", name: "R. Carlos", left: 18, top: 70, force: 91 },
  { number: "8", name: "Gérson", left: 30, top: 48, force: 89 },
  { number: "10", name: "Pelé", left: 50, top: 52, force: 99 },
  { number: "10", name: "Maradona", left: 70, top: 48, force: 99 },
  { number: "10", name: "Messi", left: 78, top: 24, force: 99 },
  { number: "9", name: "Ronaldo", left: 50, top: 18, force: 97 },
  { number: "7", name: "C. Ronaldo", left: 22, top: 24, force: 93 },
] as const;

const previewChemistry = Math.round(
  previewPlayers.reduce((total, player) => total + player.force, 0) / previewPlayers.length,
);

export function HomePage({ locale }: { locale: Locale }) {
  const t = messages[locale];
  return (
    <main className="home-wrap home-shell home-dream tx-paper">
      <header className="home-head">
        <Link className="home-brand" href={localePath(locale, "/")} aria-label={t.home.brand} prefetch={false}>
          <svg className="home-brand-ic" viewBox="0 0 40 40" aria-hidden="true">
            <path d="M13 9h14v5c0 5-3.1 9.2-7 9.2S13 19 13 14V9Z" />
            <path d="M13 12H8c0 5.2 2.7 8.3 7 8.7M27 12h5c0 5.2-2.7 8.3-7 8.7" />
            <path d="M20 23.2V29M14.5 31h11M12.5 35h15" />
          </svg>
          <span className="home-brand-title">{t.home.brand}</span>
          <span className="home-brand-years">{t.home.years}</span>
        </Link>
        <nav className="home-nav" aria-label={t.home.primaryNav}>
          <Link className="profile-link home-profile-link" href={localePath(locale, "/perfil")} prefetch={false}>
            <svg className="profile-ic" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="7.5" r="3.5" />
              <path d="M5.2 20c.8-4 4-6.1 6.8-6.1s6 2.1 6.8 6.1" />
              <path d="M8 20h8" />
            </svg>
            <span>{t.home.profile}</span>
          </Link>
          <SettingsToggle locale={locale} label={t.home.settings} />
        </nav>
      </header>
      <hr className="rule-ink" />
      <div className="home-grid">
        <section className="home-hero">
          <div className="home-score-card" aria-label={t.home.scoreLabel}>
            <span className="score-stripes" aria-hidden="true" />
            <span className="score-dots score-dots--right" aria-hidden="true" />
            <div className="score-mark" aria-hidden="true">
              <span className="score-number">8</span>
              <span className="score-dash">-</span>
              <span className="score-number">0</span>
            </div>
          </div>
          <h1 className="home-headline">
            {t.home.headline.split("\n").map((line) => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
          </h1>
          <span className="home-swoosh" aria-hidden="true" />
          <p className="home-sub">
            {t.home.sub[0]}
            <strong className="home-sub-score">{t.home.sub[1]}</strong>
            {t.home.sub[2]}
          </p>
          <div className="home-ctas">
            <Link className="btn btn-primary home-cta-main" href={localePath(locale, "/play")} prefetch={false}>
              <svg className="home-cta-ic" viewBox="0 0 32 32" aria-hidden="true">
                <circle cx="16" cy="16" r="11.5" />
                <path d="m16 9.4 5.1 3.7-2 6H12.9l-2-6L16 9.4Z" />
                <path d="M16 4.5v4.9M5.2 12.4l5.7.7M8.9 25.1l4-6M23.1 25.1l-4-6M26.8 12.4l-5.7.7" />
                <path d="m9.1 6.9 2 6.2M22.9 6.9l-1.8 6.2M4.9 19.9l8 1.1M27.1 19.9l-8 1.1" />
              </svg>
              <span>{t.home.cta}</span>
            </Link>
          </div>
        </section>
        <aside className="home-preview" aria-label={t.home.previewAria}>
          <div className="lineup-card-head">
            <span className="lineup-card-title">
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M10 7 6 10.5l3.2 5.2L12 14v12h8V14l2.8 1.7L26 10.5 22 7l-4 2h-4l-4-2Z" />
              </svg>
              {t.home.previewTitle}
            </span>
            <span className="chemistry-pill">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="m10 2.4 2.1 4.2 4.6.7-3.4 3.3.8 4.7-4.1-2.2-4.1 2.2.8-4.7-3.4-3.3 4.6-.7L10 2.4Z" />
              </svg>
              {t.home.chemistry} <b className="num">{previewChemistry}</b>
            </span>
          </div>
          <div className="home-pitch" aria-label={t.home.previewAria}>
            <PitchMarkings />
            {previewPlayers.map((player) => (
              <div key={player.name} className="hp-disc" style={{ left: `${player.left}%`, top: `${player.top}%` }}>
                <span className="hp-c num">{player.number}</span>
                <span className="hp-n">{player.name}</span>
              </div>
            ))}
          </div>
          <div className="lineup-toolbar" aria-label={t.home.previewTools}>
            <span className="lineup-tool">
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M16 5v6M8 19v-4h16v4M16 19v-8" />
                <circle cx="16" cy="5" r="2.5" />
                <circle cx="8" cy="23" r="3" />
                <circle cx="16" cy="23" r="3" />
                <circle cx="24" cy="23" r="3" />
              </svg>
              <span className="num">4-3-3</span>
            </span>
            <span className="lineup-tool">
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <circle cx="11" cy="12" r="4" />
                <circle cx="22" cy="13" r="3.2" />
                <path d="M4.8 25c.9-5 4.7-7.4 8.2-7.4 3.7 0 7.1 2.3 7.9 7.4" />
                <path d="M20 18c3.5.4 6.3 2.8 7.1 7" />
              </svg>
              <span className="num">11/11</span>
            </span>
            <span className="lineup-tool lineup-tool--reference">
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="m16 3.8 2.6 8.1 8.4 1.1-6.2 5.6 1.6 8.3L16 22.7 9.6 26.9l1.6-8.3L5 13l8.4-1.1L16 3.8Z" />
                <path d="M16 10.4v6.8M12.6 13.8h6.8" />
              </svg>
              <span>{t.home.previewNote}</span>
            </span>
          </div>
        </aside>
      </div>
      <section className="home-steps sticker">
        {t.home.steps.map(([title, description], index) => (
          <div className="how-step" key={title}>
            <span className="step-no num">{String(index + 1).padStart(2, "0")}</span>
            <span className="step-ic-wrap">
              <svg viewBox="0 0 48 48" className="step-ic" fill="none" stroke="currentColor" strokeWidth="2.4">
                {index === 0 ? (
                  <>
                    <path d="M11 16 24 8l13 8v16L24 40 11 32V16Z" />
                    <path d="M11 16 24 24l13-8M24 24v16" />
                    <circle cx="18" cy="17" r="1.8" fill="currentColor" stroke="none" />
                    <circle cx="28.5" cy="17.5" r="1.8" fill="currentColor" stroke="none" />
                    <circle cx="24" cy="27" r="1.8" fill="currentColor" stroke="none" />
                    <circle cx="18.5" cy="32" r="1.8" fill="currentColor" stroke="none" />
                    <circle cx="29" cy="32" r="1.8" fill="currentColor" stroke="none" />
                  </>
                ) : index === 1 ? (
                  <>
                    <rect x="8" y="9" width="28" height="28" rx="3" />
                    <line x1="8" y1="23" x2="36" y2="23" />
                    <circle cx="22" cy="23" r="5.2" />
                    <path d="M16 9v7h12V9M16 37v-7h12v7" />
                    <circle cx="35.5" cy="35.5" r="6" fill="#f5c822" stroke="currentColor" />
                    <path d="m35.5 30.5 1.5 3 3.2.5-2.3 2.3.5 3.2-2.9-1.5-2.9 1.5.6-3.2-2.4-2.3 3.2-.5 1.5-3Z" fill="#fff" />
                  </>
                ) : (
                  <>
                    <circle cx="21" cy="25" r="13" />
                    <path d="M21 12v-5M16 7h10M21 25l5-7M21 25h-7" />
                    <path d="M11.5 14 8 10.5M30.5 14 34 10.5" />
                    <circle cx="34" cy="34" r="7" fill="#fff" />
                    <path d="m34 28.8 2 1.5-.8 2.4h-2.4l-.8-2.4 2-1.5ZM28.6 34.2l2.4-1.4 1.8 1.7-.6 2.4h-2.5l-1.1-2.7ZM39.4 34.2l-2.4-1.4-1.8 1.7.6 2.4h2.5l1.1-2.7Z" fill="currentColor" stroke="none" />
                  </>
                )}
              </svg>
            </span>
            <div className="step-txt">
              <span className="step-t">{title}</span>
              <span className="step-d">{description}</span>
            </div>
          </div>
        ))}
      </section>
      <footer className="home-foot">
        <div className="foot-counts">
          <span className="num">56</span> {t.home.counts[0]}
          <span className="foot-dot">·</span>
          <span className="num">294</span> {t.home.counts[1]}
          <span className="foot-dot">·</span>
          <span className="num">{locale === "pt" ? "6.514" : "6,514"}</span> {t.home.counts[2]}
          <span className="foot-dot">·</span>
          <button className="contest-link">{t.home.contest}</button>
        </div>
      </footer>
    </main>
  );
}
