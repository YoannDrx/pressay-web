import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { BetterAuthSignIn } from "@/components/better-auth-sign-in";
import { appleAuthIsConfigured, identityProvider } from "@/lib/auth-env";

export default function SignUpPage() {
  const provider = identityProvider();
  return (
    <main className="auth-page">
      <Link className="brand auth-brand" href="/fr">
        <Image src="/logo.svg" width="34" height="34" alt="" />
        pressay
      </Link>
      {provider === "better-auth" ? (
        <BetterAuthSignIn callbackURL="/account" appleEnabled={appleAuthIsConfigured()} />
      ) : provider === "clerk" ? (
        <SignUp fallbackRedirectUrl="/account" signInUrl="/sign-in" />
      ) : (
        <div className="auth-placeholder">
          <span className="mono-label">COMMERCIAL BETA</span>
          <h1>Inscription bientôt disponible.</h1>
          <p>Le fournisseur d’identité doit être configuré sur staging avant d’ouvrir les comptes.</p>
          <Link className="button" href="/fr">
            Retour au site
          </Link>
        </div>
      )}
    </main>
  );
}
