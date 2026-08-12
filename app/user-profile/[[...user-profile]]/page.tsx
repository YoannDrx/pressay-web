import { UserProfile } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function UserProfilePage() {
  return (
    <main className="auth-page">
      <Link className="brand auth-brand" href="/account">
        <Image src="/logo.svg" width="34" height="34" alt="" />
        pressay
      </Link>
      {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
        <UserProfile path="/user-profile" />
      ) : (
        <div className="auth-placeholder">
          <span className="mono-label">SÉCURITÉ DU COMPTE</span>
          <h1>Profil indisponible.</h1>
          <p>Le fournisseur d’identité n’est pas configuré dans cet environnement.</p>
          <Link className="button" href="/account">
            Retour au compte
          </Link>
        </div>
      )}
    </main>
  );
}
