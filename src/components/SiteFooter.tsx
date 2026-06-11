import Link from "next/link";
import type { Locale } from "@/lib/types";
import { localePath, messages } from "@/lib/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = messages[locale];
  const kofi = process.env.NEXT_PUBLIC_KOFI_URL || "https://ko-fi.com/7a0wc";
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-meta">
          <a className="kofi-btn" href={kofi} target="_blank" rel="noopener noreferrer">
            {t.support}
          </a>
          <span className="footer-credit">
            7a0 — Sete a Zero · {t.logoSub} ·{" "}
            <Link className="footer-link" href={localePath(locale, "/privacidade")}>
              {t.privacy}
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
