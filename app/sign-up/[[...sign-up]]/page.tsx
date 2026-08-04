import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <Link className="brand auth-brand" href="/fr">
        <Image src="/logo.svg" width="34" height="34" alt="" />
        pressay
      </Link>
      {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
        <SignUp fallbackRedirectUrl="/account" signInUrl="/sign-in" />
      ) : (
        <div className="auth-placeholder">
          <span className="mono-label">COMMERCIAL BETA</span>
          <h1>Inscription bientôt disponible.</h1>
          <p>Le fournisseur Clerk doit être configuré sur staging avant d’ouvrir les comptes.</p>
          <Link className="button" href="/fr">
            Retour au site
          </Link>
        </div>
      )}
    </main>
  );
}
