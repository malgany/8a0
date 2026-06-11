"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { Draft, Locale, Player, SimResult } from "@/lib/types";
import { calculateStats } from "@/lib/game";
import { draftToSharePayload, encodeSharePayload } from "@/lib/share";
import { messages } from "@/lib/i18n";
import { nationFlag } from "@/lib/nations";
import { Logo } from "./Logo";

export function ResultCard({
  locale,
  result,
  draft,
  onAgain,
}: {
  locale: Locale;
  result: SimResult;
  draft: Draft;
  onAgain?: () => void;
}) {
  const t = messages[locale];
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const xi = draft.filled.filter(Boolean) as Player[];
  const overall = calculateStats(draft).overall;

  async function ensureShareUrl() {
    if (shareUrl) return shareUrl;
    const code = encodeSharePayload(draftToSharePayload(draft));
    let slug = code;
    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (response.ok) {
        const json = (await response.json()) as { slug?: string };
        slug = json.slug || code;
      }
    } catch {
      slug = code;
    }
    const url = `${window.location.origin}/${locale === "pt" ? "" : `${locale}/`}r/${slug}`;
    setShareUrl(url);
    return url;
  }

  async function shareLink() {
    const url = await ensureShareUrl();
    if (navigator.share) {
      await navigator.share({ title: "7a0", url }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(url);
      alert(t.card.copied);
    }
  }

  async function shareImage() {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: document.documentElement.classList.contains("theme-terrace") ? "#0B1A12" : "#F3ECD8",
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "7a0-card.png";
      link.click();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-stage">
      <div className="card-stage-inner">
        <div ref={cardRef} className="card-collectible skin-panini" style={{ position: "relative" }}>
          <div className="cc-tx tx-paper" />
          {draft.options.mode === "almanaque" && <span className="cc-almanaque">{t.card.memory}</span>}
          <div className="cc-head">
            <span className="cc-brand">
              <Logo />
            </span>
            <span className="cc-seed num">
              {t.card.seed} #{draft.seed.toUpperCase()}
            </span>
          </div>
          <div className="cc-hero">
            <span className="cc-champ">{result.champion ? t.card.champion : t.card.eliminated}</span>
            <div className="cc-mark">
              <span className="num" style={{ fontSize: "clamp(64px,12vw,150px)", lineHeight: 0.85 }}>
                {result.record}
              </span>
            </div>
            {result.perfect && <span className="cc-perfect">{t.card.perfect}</span>}
          </div>
          <div className="cc-stats">
            <div className="cc-stat">
              <span className="num">{result.gf}</span>
              <label>{t.card.gf}</label>
            </div>
            <div className="cc-stat">
              <span className="num">{result.ga}</span>
              <label>{t.card.ga}</label>
            </div>
            <div className="cc-stat">
              <span className="num">{overall}</span>
              <label>{t.play.overall}</label>
            </div>
            <div className="cc-stat">
              <span className={result.perfect ? "cc-inv" : "cc-inv num"}>{result.wins}</span>
              <label>{result.perfect ? t.card.unbeaten : t.card.wins}</label>
            </div>
          </div>
          <div className="cc-lineup">
            {xi.map((player) => (
              <span className={`cc-chip ${player.legend ? "is-legend" : ""}`} key={`${player.sel}-${player.copa}-${player.playerId}`}>
                <span className="cc-chip-num num">{player.number}</span>
                <span className={`cc-chip-name ${player.legend ? "foil-text" : ""}`}>{player.name}</span>
                <span className="cc-chip-org">
                  {nationFlag(player.sel)} {player.sel}
                  <span className="num">{player.copa}</span>
                </span>
              </span>
            ))}
          </div>
          {result.badge && (
            <div className="cc-badge">
              <span className="cc-badge-star">★</span>
              <span className="cc-badge-txt">{result.badge}</span>
            </div>
          )}
          <div className="cc-foot">
            <span className="cc-url">{t.card.url}</span>
          </div>
        </div>
        <div className="card-actions">
          <button className="btn btn-primary card-act-main" onClick={shareImage} disabled={busy}>
            {busy ? "..." : t.card.image}
          </button>
          <button className="btn btn-secondary" onClick={shareLink}>
            {t.card.link}
          </button>
          {onAgain && (
            <button className="btn btn-secondary" onClick={onAgain}>
              {t.card.again}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
