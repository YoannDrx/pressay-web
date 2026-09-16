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
  if (!(await getWebIdentity()))
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
