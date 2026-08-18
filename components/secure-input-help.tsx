import Link from "next/link";
import { ContentPage } from "@/components/content-page";
import type { Locale } from "@/lib/content";

export function SecureInputHelp({ locale }: { locale: Locale }) {
  const fr = locale === "fr";
  const steps = fr
    ? [
        "Quittez le champ de mot de passe ou de clé API, puis attendez une seconde.",
        "Dans Terminal, désactivez Saisie clavier sécurisée dans le menu Terminal si elle est cochée.",
        "Fermez l’app qui conserve Secure Input. Si le blocage persiste partout, verrouillez puis déverrouillez le Mac, ou redémarrez-le.",
      ]
    : [
        "Leave the password or API-key field, then wait one second.",
        "In Terminal, turn off Secure Keyboard Entry in the Terminal menu if it is enabled.",
        "Quit the app that keeps Secure Input active. If every app remains blocked, lock and unlock the Mac, or restart it.",
      ];

  return (
    <ContentPage
      locale={locale}
      eyebrow="SUPPORT / SECURE INPUT"
      title={
        fr
          ? "Votre secret reste hors de portée."
          : "Your secret stays out of reach."
      }
      intro={
        fr
          ? "macOS active Secure Input dans les champs sensibles. Pressay respecte ce verrou et suspend les raccourcis globaux tant qu’il est actif."
          : "macOS enables Secure Input in sensitive fields. Pressay respects that lock and pauses global shortcuts while it is active."
      }
    >
      <article className="legal-document secure-input-document" id="secure-input">
        <div className="legal-notice">
          <strong>{fr ? "DANS VOTRE CAS" : "IN YOUR CASE"}</strong>
          <p>
            {fr
              ? "L’avertissement est apparu parce que le champ de clé API est volontairement sécurisé. C’est le comportement attendu : Pressay ne lit pas les frappes, ne journalise pas la clé et la conserve uniquement dans le Trousseau macOS après validation."
              : "The warning appeared because the API-key field is intentionally protected. This is expected: Pressay does not read keystrokes, does not log the key, and stores it only in macOS Keychain after validation."}
          </p>
        </div>

        <section>
          <span>01</span>
          <h2>{fr ? "Ce que protège Secure Input" : "What Secure Input protects"}</h2>
          <p>
            {fr
              ? "Pendant qu’un champ secret est actif, macOS empêche les autres applications d’observer les événements clavier globaux. La dictée locale reste disponible depuis l’interface, mais un raccourci global peut momentanément ne pas être reçu."
              : "While a secret field is active, macOS prevents other apps from observing global keyboard events. Local dictation remains available from the interface, but a global shortcut may temporarily stop arriving."}
          </p>
        </section>

        <section>
          <span>02</span>
          <h2>{fr ? "Revenir à la normale" : "Return to normal"}</h2>
          <ol>
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section>
          <span>03</span>
          <h2>{fr ? "Toujours bloqué ?" : "Still blocked?"}</h2>
          <p>
            {fr
              ? "Ouvrez le menu Pressay : l’indicateur disparaît dès que macOS libère Secure Input. Si ce n’est pas le cas, contactez le support avec la version de macOS et le nom de l’app concernée — jamais avec votre clé."
              : "Open the Pressay menu: the indicator disappears as soon as macOS releases Secure Input. If it does not, contact support with your macOS version and the affected app name — never with your key."}
          </p>
          <div className="legal-actions">
            <a
              className="button button-primary"
              href="mailto:hello@press-say.app?subject=Pressay%20Secure%20Input"
            >
              hello@press-say.app
            </a>
            <Link className="button" href={`/${locale}/support`}>
              {fr ? "Tout le support" : "All support topics"}
            </Link>
          </div>
        </section>
      </article>
    </ContentPage>
  );
}
