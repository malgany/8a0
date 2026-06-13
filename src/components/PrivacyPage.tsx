import Link from "next/link";
import type { Locale } from "@/lib/types";
import { localePath, messages } from "@/lib/i18n";
import { SettingsToggle } from "./ChromeControls";

const privacyCopy = {
  pt: {
    back: "Voltar",
    updated: "Atualizado em 12 de junho de 2026.",
    lead:
      "O 8a0 foi pensado para jogar sem cadastro. A experiência guarda apenas o necessário para manter suas preferências e permitir que você compartilhe um time ou resultado.",
    sections: [
      [
        "Dados locais",
        "Tema, idioma e preferências de jogo ficam salvos no seu próprio navegador. Esses dados não identificam você e podem ser apagados limpando os dados do site no navegador.",
      ],
      [
        "Times e links compartilhados",
        "Quando você compartilha um resultado, o link contém somente a composição gerada: seed, formação, estilo, modo e jogadores escolhidos. Não há nome, e-mail, conta ou perfil pessoal nesse link.",
      ],
      [
        "Cookies e anúncios",
        "O jogo não usa cookies de login. Caso anúncios estejam configurados no ambiente publicado, cookies de publicidade podem ser usados para medir exibição e limitar repetição de anúncios.",
      ],
      [
        "Seus controles",
        "Você pode jogar sem informar dados pessoais, trocar idioma e tema a qualquer momento e descartar preferências locais limpando o armazenamento do site.",
      ],
    ],
  },
  en: {
    back: "Back",
    updated: "Last updated: June 12, 2026.",
    lead:
      "8a0 is designed to be played without an account. The experience stores only what is needed to keep your preferences and let you share a generated team or result.",
    sections: [
      [
        "Local data",
        "Theme, language, and game preferences are stored in your own browser. This data does not identify you and can be removed by clearing this site's data in the browser.",
      ],
      [
        "Shared teams and links",
        "When you share a result, the link contains only the generated composition: seed, formation, style, mode, and selected players. It does not include a name, email, account, or personal profile.",
      ],
      [
        "Cookies and ads",
        "The game does not use login cookies. If ads are configured in the published environment, advertising cookies may be used to measure impressions and limit repeated ads.",
      ],
      [
        "Your controls",
        "You can play without providing personal data, change language and theme at any time, and discard local preferences by clearing this site's storage.",
      ],
    ],
  },
  es: {
    back: "Volver",
    updated: "Actualizado el 12 de junio de 2026.",
    lead:
      "8a0 está pensado para jugar sin registro. La experiencia guarda solo lo necesario para mantener tus preferencias y permitirte compartir un equipo o resultado generado.",
    sections: [
      [
        "Datos locales",
        "Tema, idioma y preferencias de juego quedan guardados en tu propio navegador. Estos datos no te identifican y se pueden borrar limpiando los datos del sitio en el navegador.",
      ],
      [
        "Equipos y enlaces compartidos",
        "Cuando compartes un resultado, el enlace contiene solo la composición generada: seed, formación, estilo, modo y jugadores elegidos. No incluye nombre, correo, cuenta ni perfil personal.",
      ],
      [
        "Cookies y anuncios",
        "El juego no usa cookies de inicio de sesión. Si hay anuncios configurados en el entorno publicado, las cookies publicitarias pueden usarse para medir impresiones y limitar repeticiones.",
      ],
      [
        "Tus controles",
        "Puedes jugar sin proporcionar datos personales, cambiar idioma y tema cuando quieras, y descartar preferencias locales limpiando el almacenamiento del sitio.",
      ],
    ],
  },
} as const;

export function PrivacyPage({ locale }: { locale: Locale }) {
  const t = messages[locale];
  const copy = privacyCopy[locale];

  return (
    <main className="privacy-dream home-dream tx-paper">
      <header className="home-head privacy-head">
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
          <Link className="profile-link privacy-back-link" href={localePath(locale, "/")} prefetch={false}>
            <svg className="profile-ic" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5 8 12l7 7" />
              <path d="M9 12h11" />
            </svg>
            <span>{copy.back}</span>
          </Link>
          <SettingsToggle locale={locale} label={t.home.settings} />
        </nav>
      </header>
      <hr className="rule-ink" />
      <article className="privacy-card">
        <div className="privacy-kicker">
          <span>8A0</span>
          <span>{copy.updated}</span>
        </div>
        <h1 className="privacy-title">{t.privacy}</h1>
        <p className="privacy-lead">{copy.lead}</p>
        <div className="privacy-sections">
          {copy.sections.map(([title, description]) => (
            <section className="privacy-section" key={title}>
              <h2>{title}</h2>
              <p>{description}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
