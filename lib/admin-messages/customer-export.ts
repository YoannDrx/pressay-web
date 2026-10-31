import type { AdminLocale } from "../admin-i18n.ts";

/** Access-request export on the customer record. */
export const customerExportMessages = {
  fr: {
    title: "Demande d’accès (RGPD)",
    detail:
      "Télécharge en JSON toutes les données de ce compte : données Cloud, actions de support, invitations réservées à son adresse, listes d’attente, et connexion au site (méthodes de connexion, clés d’accès, sessions, code Authenticator). Demande le code Authenticator (10 minutes) ; chaque export est inscrit au journal d’audit. Vérifie le fichier avant de l’envoyer au client.",
    button: "Exporter les données (JSON)",
    stepUp: "Saisis ton code Authenticator dans le panneau ouvert, puis réessaie.",
    done: "Export téléchargé et audité.",
    failed: "Export indisponible ({status}).",
    offline: "Connexion indisponible. Réessaie.",
  },
  en: {
    title: "Access request (GDPR)",
    detail:
      "Downloads every piece of data of this account as JSON: Cloud data, support actions, invitations reserved to its address, waitlists, and site sign-in (sign-in methods, passkeys, sessions, Authenticator). Asks for the Authenticator code (10 minutes); each export is written to the audit log. Check the file before sending it to the customer.",
    button: "Export data (JSON)",
    stepUp: "Enter your Authenticator code in the open panel, then try again.",
    done: "Export downloaded and audited.",
    failed: "Export unavailable ({status}).",
    offline: "Connection unavailable. Try again.",
  },
} satisfies Record<AdminLocale, unknown>;
