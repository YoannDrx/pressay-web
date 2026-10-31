import type { AdminLocale } from "../admin-i18n.ts";

/** Advanced metrics and CSV exports of /admin/metrics. */
export const metricsMessages = {
  fr: {
    period: {
      label: "Période",
      months: "{count} mois",
      days: "Téléchargements sur",
      daysOption: "{count} jours",
      apply: "Afficher",
    },
    history: {
      since:
        "Historique des statuts d’abonnement depuis le {date}. Avant cette date, seul le statut connu à ce moment est pris en compte.",
      empty:
        "L’historique des statuts d’abonnement n’a pas encore commencé (migration non appliquée ou aucun abonnement).",
    },
    churn: {
      title: "Churn mensuel",
      detail:
        "Abonnements Production payants au début du mois, nouveaux payants du mois (premier paiement, essai converti, retour) et arrêts (résilié, expiré, remboursé, en pause). Mois UTC, Sandbox exclu.",
      headers: ["Mois", "Payants au début", "Nouveaux payants", "Arrêts", "Churn"],
      last: "Churn du mois dernier",
    },
    cohorts: {
      title: "Conversion gratuit → payant par cohorte",
      detail:
        "Comptes créés dans le mois, puis ceux qui ont payé au moins une fois (statut payant ou facture Stripe payée) et ceux qui ont payé dans les 30 jours.",
      headers: [
        "Cohorte",
        "Inscriptions",
        "Ont payé",
        "Conversion",
        "Sous 30 jours",
        "Ont commencé un essai",
      ],
    },
    trials: {
      title: "Essais",
      detail:
        "Essais par mois de début : convertis en abonnement payant, arrêtés sans payer, encore en cours.",
      headers: ["Mois", "Commencés", "Convertis", "Arrêtés", "En cours", "Conversion"],
    },
    downloads: {
      title: "Téléchargements détaillés ({days} jours)",
      platforms: "Par plateforme",
      versions: "Par version",
      sources: "Par source",
      campaigns: "Par campagne",
      headers: {
        platform: "Plateforme",
        version: "Version",
        source: "Source",
        campaign: "Campagne",
        count: "Téléchargements",
      },
    },
    exports: {
      title: "Exports CSV",
      detail:
        "Agrégats sans donnée personnelle. Chaque export demande le code Authenticator (10 minutes) et est inscrit au journal d’audit.",
      churn: "Churn (CSV)",
      cohorts: "Cohortes (CSV)",
      trials: "Essais (CSV)",
      downloads: "Téléchargements par jour (CSV)",
      signups: "Inscriptions par jour (CSV)",
      stepUp: "Saisis ton code Authenticator dans le panneau ouvert, puis réessaie.",
      done: "Export téléchargé et audité.",
      failed: "Export indisponible ({status}).",
      offline: "Connexion indisponible. Réessaie.",
    },
    unavailable:
      "Indicateurs avancés indisponibles pour le moment (historique non migré ou service injoignable).",
  },
  en: {
    period: {
      label: "Period",
      months: "{count} months",
      days: "Downloads over",
      daysOption: "{count} days",
      apply: "Show",
    },
    history: {
      since:
        "Subscription status history since {date}. Before that date, only the status known at that time is used.",
      empty:
        "The subscription status history has not started yet (migration not applied or no subscription).",
    },
    churn: {
      title: "Monthly churn",
      detail:
        "Paying Production subscriptions at the start of the month, new paying ones (first payment, converted trial, comeback) and stops (canceled, expired, refunded, paused). UTC months, Sandbox excluded.",
      headers: ["Month", "Paying at start", "New paying", "Stops", "Churn"],
      last: "Last month's churn",
    },
    cohorts: {
      title: "Free → paid conversion by cohort",
      detail:
        "Accounts created in the month, then those that paid at least once (paying status or paid Stripe invoice) and those that paid within 30 days.",
      headers: [
        "Cohort",
        "Sign-ups",
        "Paid",
        "Conversion",
        "Within 30 days",
        "Started a trial",
      ],
    },
    trials: {
      title: "Trials",
      detail:
        "Trials by start month: converted to a paid subscription, stopped without paying, still running.",
      headers: ["Month", "Started", "Converted", "Stopped", "Running", "Conversion"],
    },
    downloads: {
      title: "Download breakdown ({days} days)",
      platforms: "By platform",
      versions: "By version",
      sources: "By source",
      campaigns: "By campaign",
      headers: {
        platform: "Platform",
        version: "Version",
        source: "Source",
        campaign: "Campaign",
        count: "Downloads",
      },
    },
    exports: {
      title: "CSV exports",
      detail:
        "Aggregates without personal data. Each export asks for the Authenticator code (10 minutes) and is written to the audit log.",
      churn: "Churn (CSV)",
      cohorts: "Cohorts (CSV)",
      trials: "Trials (CSV)",
      downloads: "Downloads per day (CSV)",
      signups: "Sign-ups per day (CSV)",
      stepUp: "Enter your Authenticator code in the open panel, then try again.",
      done: "Export downloaded and audited.",
      failed: "Export unavailable ({status}).",
      offline: "Connection unavailable. Try again.",
    },
    unavailable:
      "Advanced metrics are unavailable for now (history not migrated or service unreachable).",
  },
} satisfies Record<AdminLocale, unknown>;

export type MetricsMessages = (typeof metricsMessages)["fr"];
