import { redirect } from "next/navigation";
import { getWebIdentity } from "@/lib/server-identity";
import { safeLocalRedirect } from "@/lib/safe-redirect";
import { accountLocale } from "@/lib/account-locale";
import { ClerkProvider, SignIn } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { BetterAuthSignIn } from "@/components/better-auth-sign-in";
import { appleAuthIsConfigured, identityProvider } from "@/lib/auth-env";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string; locale?: string }>;
}) {
  const provider = identityProvider();
  const requestedRedirect = (await searchParams).redirect_url;
  const locale =
    (await searchParams).locale === "en"
      ? "en"
      : (await searchParams).locale === "fr"
        ? "fr"
        : await accountLocale();
  const callbackURL = safeLocalRedirect(requestedRedirect);
  if (provider !== "disabled" && (await getWebIdentity()))
    redirect(callbackURL);
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
          appleEnabled={appleAuthIsConfigured()}
        />
      ) : provider === "clerk" ? (
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        >
          <SignIn
            fallbackRedirectUrl={callbackURL}
            signUpFallbackRedirectUrl={callbackURL}
            signUpUrl="/sign-up"
            withSignUp
          />
        </ClerkProvider>
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
