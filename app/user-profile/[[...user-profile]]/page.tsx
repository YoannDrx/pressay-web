import { UserProfile } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { AccountSecurity } from "@/components/account-security";
import { identityProvider } from "@/lib/auth-env";
import { getWebIdentity } from "@/lib/server-identity";
import { redirect } from "next/navigation";

export default async function UserProfilePage() {
  const provider = identityProvider();
  if (provider === "better-auth") {
    if (!await getWebIdentity()) redirect("/sign-in?redirect_url=/user-profile");
  }
  return (
    <main className="auth-page">
      <Link className="brand auth-brand" href="/account">
        <Image src="/logo.svg" width="34" height="34" alt="" />
        pressay
      </Link>
      {provider === "better-auth" ? (
        <AccountSecurity initialSessions={[]} />
      ) : provider === "clerk" ? (
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
