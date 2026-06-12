import Link from "next/link";
import type { Locale } from "@/lib/types";
import { localePath, messages } from "@/lib/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = messages[locale];
  const [firstStep, secondStep, thirdStep] = t.home.steps;

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span className="footer-credit">
          8a0 - {firstStep[0]} <span aria-hidden="true">/</span> {secondStep[0]} <span aria-hidden="true">/</span>{" "}
          {thirdStep[0]} <span aria-hidden="true">/</span>{" "}
          <Link className="footer-link" href={localePath(locale, "/privacidade")} prefetch={false}>
            {t.privacy}
          </Link>
        </span>
      </div>
    </footer>
  );
}
