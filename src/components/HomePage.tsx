import Link from "next/link";
import type { Locale } from "@/lib/types";
import { localePath, messages } from "@/lib/i18n";
import { SettingsToggle } from "./ChromeControls";
import { Mark70 } from "./Logo";
import { PitchMarkings } from "./PitchMarkings";

const previewPlayers = [
  ["1", "Neuer", 50, 88],
  ["4", "C. Alberto", 82, 70],
  ["5", "Beckenbauer", 60, 74],
  ["6", "Moore", 40, 74],
  ["6", "R. Carlos", 18, 70],
  ["8", "Gérson", 30, 48],
  ["10", "Pelé", 50, 52],
  ["10", "Maradona", 70, 48],
  ["10", "Messi", 78, 24],
  ["9", "Ronaldo", 50, 18],
  ["7", "C. Ronaldo", 22, 24],
] as const;

export function HomePage({ locale }: { locale: Locale }) {
  const t = messages[locale];
  return (
    <main className="home-wrap home-shell tx-paper">
      <header className="home-head">
        <nav className="home-nav">
          <Link className="profile-link" href={localePath(locale, "/perfil")}>
            <svg className="profile-ic" viewBox="0 0 16 16" aria-hidden="true">
              <rect x="2.5" y="3" width="11" height="10" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M5 6.2h2.2M5 9.5h6M9.2 6.2H11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {t.home.profile}
          </Link>
          <SettingsToggle locale={locale} label={t.home.settings} />
        </nav>
      </header>
      <hr className="rule-ink" />
      <div className="home-grid">
        <section className="home-hero">
          <span className="eyebrow">{t.home.eyebrow}</span>
          <div className="home-mark">
            <Mark70 />
          </div>
          <h1 className="home-headline">
            {t.home.headline.split("\n").map((line) => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
          </h1>
          <p className="home-sub">{t.home.sub}</p>
          <div className="home-ctas">
            <Link className="btn btn-primary home-cta-main" href={localePath(locale, "/play")}>
              {t.home.cta}
            </Link>
            <Link className="btn btn-secondary home-cta-multi" href={localePath(locale, "/multi")}>
              {t.home.ctaMulti}
              <span className="new-badge">{t.home.newBadge}</span>
            </Link>
          </div>
        </section>
        <aside className="home-preview">
          <div className="home-pitch" aria-label="Dream team: World Cup legends">
            <PitchMarkings />
            {previewPlayers.map(([number, name, left, top]) => (
              <div key={name} className="hp-disc" style={{ left: `${left}%`, top: `${top}%` }}>
                <span className="hp-c num">{number}</span>
                <span className="hp-n">{name}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
      <section className="home-steps sticker">
        {t.home.steps.map(([title, description], index) => (
          <div className="how-step" key={title}>
            <span className="step-no num">{String(index + 1).padStart(2, "0")}</span>
            <span className="step-ic-wrap">
              <svg viewBox="0 0 40 40" className="step-ic" fill="none" stroke="currentColor" strokeWidth="2.4">
                {index === 0 ? (
                  <>
                    <rect x="6" y="6" width="28" height="28" rx="2" />
                    <circle cx="14" cy="14" r="2.2" fill="currentColor" stroke="none" />
                    <circle cx="26" cy="14" r="2.2" fill="currentColor" stroke="none" />
                    <circle cx="20" cy="20" r="2.2" fill="currentColor" stroke="none" />
                    <circle cx="14" cy="26" r="2.2" fill="currentColor" stroke="none" />
                    <circle cx="26" cy="26" r="2.2" fill="currentColor" stroke="none" />
                  </>
                ) : index === 1 ? (
                  <>
                    <rect x="5" y="6" width="30" height="28" rx="1.5" />
                    <line x1="5" y1="20" x2="35" y2="20" />
                    <circle cx="20" cy="20" r="4.5" />
                    <rect x="13" y="6" width="14" height="5" />
                    <rect x="13" y="29" width="14" height="5" />
                  </>
                ) : (
                  <>
                    <path d="M8 9h8v9h8" />
                    <path d="M8 31h8v-9" />
                    <path d="M24 18h8" />
                    <circle cx="33" cy="18" r="2.4" fill="currentColor" stroke="none" />
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
          <span className="num">52</span> {t.home.counts[0]}
          <span className="foot-dot">·</span>
          <span className="num">250</span> {t.home.counts[1]}
          <span className="foot-dot">·</span>
          <span className="num">{locale === "pt" ? "5.729" : "5,729"}</span> {t.home.counts[2]}
          <span className="foot-dot">·</span>
          <button className="contest-link">{t.home.contest}</button>
        </div>
      </footer>
    </main>
  );
}
