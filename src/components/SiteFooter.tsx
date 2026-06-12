import Link from "next/link";
import type { Locale } from "@/lib/types";
import { localePath, messages } from "@/lib/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = messages[locale];

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span className="footer-credit">
          8a0 - Oito a Zero <span aria-hidden="true">/</span> {t.logoSub} <span aria-hidden="true">/</span>{" "}
          <Link className="footer-link" href={localePath(locale, "/privacidade")} prefetch={false}>
            {t.privacy}
          </Link>
        </span>
      </div>
    </footer>
  );
}
