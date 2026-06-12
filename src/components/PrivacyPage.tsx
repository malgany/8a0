import Link from "next/link";
import type { Locale } from "@/lib/types";
import { localePath, messages } from "@/lib/i18n";
import { LanguageToggle, ThemeToggle } from "./ChromeControls";

export function PrivacyPage({ locale }: { locale: Locale }) {
  const t = messages[locale];
  return (
    <main className="home-wrap privacy-wrap tx-paper">
      <header className="home-head">
        <nav className="home-nav">
          <Link className="btn btn-secondary" href={localePath(locale, "/")} prefetch={false}>
            {locale === "pt" ? "voltar ao 8a0" : locale === "es" ? "volver a 8a0" : "back to 8a0"}
          </Link>
          <LanguageToggle locale={locale} />
          <ThemeToggle />
        </nav>
      </header>
      <hr className="rule-ink" />
      <article className="privacy-card sticker">
        <span className="eyebrow">8a0</span>
        <h1 className="home-headline">{t.privacy}</h1>
        <p className="home-sub">{locale === "pt" ? "Atualizado em 3 de junho de 2026." : "Last updated: June 3, 2026."}</p>
        <section>
          <h2>Dados</h2>
          <p>
            O 8a0 não exige cadastro para jogar. Preferências locais ficam no navegador, e links
            compartilhados armazenam apenas a composição do time gerado.
          </p>
        </section>
        <section>
          <h2>Cookies e publicidade</h2>
          <p>
            Quando configurado, o site pode carregar anúncios via Google AdSense. Terceiros podem usar
            cookies para exibir anúncios com base em visitas anteriores.
          </p>
        </section>
        <section>
          <h2>Serviços de terceiros</h2>
          <p>
            Além de publicidade configurável, faixas de contato/anúncio podem apontar para canais externos
            de divulgação. Essas integrações são controladas por configuração neste clone.
          </p>
        </section>
      </article>
    </main>
  );
}
