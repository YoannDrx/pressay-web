import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { BetterAuthSignIn } from "@/components/better-auth-sign-in";
import { identityProvider } from "@/lib/auth-env";

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const provider = identityProvider();
  const requestedRedirect = (await searchParams).redirect_url;
  const callbackURL = safeLocalRedirect(requestedRedirect);
  return (
    <main className="auth-page">
      <Link className="brand auth-brand" href="/fr">
        <Image src="/logo.svg" width="34" height="34" alt="" />
        pressay
      </Link>
      {provider === "better-auth" ? (
        <BetterAuthSignIn callbackURL={callbackURL} />
      ) : provider === "clerk" ? (
        <SignIn
          fallbackRedirectUrl={callbackURL}
          signUpFallbackRedirectUrl={callbackURL}
          signUpUrl="/sign-up"
          withSignUp
        />
      ) : (
        <div className="auth-placeholder">
          <span className="mono-label">COMMERCIAL BETA</span>
          <h1>Connexion bientôt disponible.</h1>
          <p>Le fournisseur d’identité doit être configuré sur staging avant d’ouvrir les comptes.</p>
          <Link className="button" href="/fr">
            Retour au site
          </Link>
        </div>
      )}
    </main>
  );
}

function safeLocalRedirect(value: string | undefined): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/account";
}
