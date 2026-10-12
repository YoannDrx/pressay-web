import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getWebIdentity } from "@/lib/server-identity";
import { safeLocalRedirect } from "@/lib/safe-redirect";
import { accountLocale } from "@/lib/account-locale";
import Image from "next/image";
import Link from "next/link";
import { BetterAuthSignIn } from "@/components/better-auth-sign-in";
import { appleAuthIsConfigured, identityProvider } from "@/lib/auth-env";
import { privateMetadata } from "@/lib/page-metadata";
import { providerHint, signInErrorView } from "@/lib/sign-in-errors";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const requested = first((await searchParams).locale);
  const locale =
    requested === "en" || requested === "fr" ? requested : await accountLocale();
  return { title: locale === "fr" ? "Connexion" : "Sign in", ...privateMetadata };
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const provider = identityProvider();
  const requested = first(params.locale);
  const locale =
    requested === "en" || requested === "fr" ? requested : await accountLocale();
  const callbackURL = safeLocalRedirect(first(params.redirect_url));
  const appleEnabled = appleAuthIsConfigured();
  const error = signInErrorView(params.error, params.error_description, locale);
  if (error)
    // Code only: support can correlate a report without any personal data.
    console.warn("[auth] sign_in_error", error.code);
  const hint = providerHint(params.provider, params.redirect_url);
  const suggested = hint === "apple" && !appleEnabled ? null : hint;
  // During the desktop OAuth flow the signed authorize query is on this page
  // and must survive a sign-in; never short-circuit it to /account.
  const oauthFlow = typeof params.sig === "string";
  if (provider !== "disabled" && !oauthFlow) {
    let identity = null;
    try {
      identity = await getWebIdentity();
    } catch {
      // A database hiccup must not hide the sign-in buttons.
    }
    if (identity) redirect(callbackURL);
  }
  return (
    <main className="auth-page">
      <Link className="brand auth-brand" href={`/${locale}`}>
        <Image src="/logo.svg" width="34" height="34" alt="" />
        pressay
      </Link>
      {provider === "better-auth" ? (
        <BetterAuthSignIn
          locale={locale}
          callbackURL={callbackURL}
          appleEnabled={appleEnabled}
          suggestedProvider={suggested}
          autoStart={Boolean(suggested) && !error}
          error={error}
        />
      ) : (
        <div className="auth-placeholder">
          <span className="mono-label">PRESSAY</span>
          <h1>
            {locale === "fr"
              ? "Connexion bientôt disponible."
              : "Sign-in available soon."}
          </h1>
          <p>
            {locale === "fr"
              ? "L’espace compte est temporairement indisponible. Tu peux continuer à utiliser la dictée locale gratuitement."
              : "Your account is temporarily unavailable. You can keep using local dictation for free."}
          </p>
          <Link className="button" href={`/${locale}`}>
            {locale === "fr" ? "Retour au site" : "Back to website"}
          </Link>
        </div>
      )}
    </main>
  );
}
