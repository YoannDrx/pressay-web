import type { Metadata } from "next";
import Link from "next/link";
import { accountLocale } from "@/lib/account-locale";
import { privateMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = { title: "Checkout", ...privateMetadata };

export default async function Page() {
  const locale = await accountLocale();
  const fr = locale === "fr";
  return (
    <main className="auth-page">
      <div className="auth-placeholder">
        <span className="mono-label">CHECKOUT / CANCELLED</span>
        <h1>{fr ? "Aucun paiement effectué." : "No payment was made."}</h1>
        <p>
          {fr
            ? "La dictée locale Free reste disponible sans compte, quota ni réseau."
            : "Free local dictation remains available without an account, quota or network."}
        </p>
        <Link className="button" href={`/${locale}/pricing`}>
          {fr ? "Retour aux tarifs" : "Back to pricing"}
        </Link>
      </div>
    </main>
  );
}
