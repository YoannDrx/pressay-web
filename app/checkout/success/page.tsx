import Link from "next/link";

export default function Page() {
  return (
    <main className="auth-page">
      <div className="auth-placeholder">
        <span className="mono-label">CHECKOUT / CONFIRMATION</span>
        <h1>Paiement en cours de confirmation.</h1>
        <p>
          Pressay Pro est activé uniquement après confirmation signée de Stripe. La
          redirection du navigateur ne suffit jamais à accorder un droit.
        </p>
        <Link className="button button-primary" href="/account">
          Vérifier mon compte
        </Link>
      </div>
    </main>
  );
}
