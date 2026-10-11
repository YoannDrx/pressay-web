import type { Metadata } from "next";
import Link from "next/link";
import { accountLocale } from "@/lib/account-locale";
import { privateMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = { title: "Checkout", ...privateMetadata };

export default async function Page() {
  const fr = (await accountLocale()) === "fr";
  return (
    <main className="auth-page">
      <div className="auth-placeholder">
        <span className="mono-label">CHECKOUT / CONFIRMATION</span>
        <h1>
          {fr
            ? "Paiement en cours de confirmation."
            : "Payment confirmation in progress."}
        </h1>
        <p>
          {fr
            ? "Pressay Pro est activé uniquement après confirmation signée de Stripe. La redirection du navigateur ne suffit jamais à accorder un droit. Cela prend en général moins d’une minute."
            : "Pressay Pro is activated only after Stripe’s signed confirmation. A browser redirect never grants access by itself. This usually takes less than a minute."}
        </p>
        <Link className="button button-primary" href="/account">
          {fr ? "Vérifier mon compte" : "Check my account"}
        </Link>
      </div>
    </main>
  );
}
