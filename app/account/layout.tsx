import { headers } from "next/headers";
import { safeLocalRedirect } from "@/lib/safe-redirect";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getWebIdentity } from "@/lib/server-identity";
import { identityProvider } from "@/lib/auth-env";
import { accountLocale } from "@/lib/account-locale";
import { AccountNavigation } from "@/components/account-navigation";
import { SessionNavigation } from "@/components/session-navigation";
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await accountLocale();
  if (identityProvider() === "disabled")
    return (
      <main className="auth-page">
        <p>
          {locale === "fr"
            ? "Compte temporairement indisponible."
            : "Account temporarily unavailable."}
        </p>
      </main>
    );
  let identity;
  try {
    identity = await getWebIdentity();
  } catch {
    // The identity database can time out while a suspended branch resumes.
    // Render a recoverable state instead of failing the whole request.
    console.error("[account] identity_read_failed");
    return (
      <main className="auth-page">
        <div className="auth-placeholder" role="alert">
          <span className="mono-label">PRESSAY</span>
          <h1>
            {locale === "fr"
              ? "Compte momentanément indisponible."
              : "Account temporarily unavailable."}
          </h1>
          <p>
            {locale === "fr"
              ? "Le service de connexion met plus de temps que prévu à répondre. Réessaie dans quelques secondes ; la dictée locale continue de fonctionner."
              : "The sign-in service is taking longer than expected. Try again in a few seconds; local dictation keeps working."}
          </p>
          {/* Full document reload: retry the whole server render. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="button button-primary" href="/account">
            {locale === "fr" ? "Réessayer" : "Try again"}
          </a>
        </div>
      </main>
    );
  }
  if (!identity)
    redirect(
      `/sign-in?locale=${locale}&redirect_url=${encodeURIComponent(safeLocalRedirect((await headers()).get("x-pressay-path") ?? undefined))}`,
    );
  return (
    <div className="account-shell">
      <header className="account-shell-header">
        <Link className="brand" href={`/${locale}`}>
          <span className="brand-logo" aria-hidden="true" />
          pressay
        </Link>
        <Link href={`/${locale}`}>
          {locale === "fr" ? "Retour au site" : "Back to website"}
        </Link>
        <SessionNavigation locale={locale} />
      </header>
      <AccountNavigation locale={locale} />
      <main className="account-content" lang={locale}>
        {children}
      </main>
    </div>
  );
}
