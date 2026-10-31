import type { AdminLocale } from "../admin-i18n.ts";

/** Administrators, roles and the Authenticator requirement. */
export const teamMessages = {
  fr: {
    nav: { members: "Membres" },
    roles: {
      owner: "Propriétaire",
      support: "Support",
      readonly: "Lecture seule",
    },
    roleDetails: {
      owner:
        "Tout : facturation (promotions Stripe, relance de webhooks, récompenses), critères de lancement et membres.",
      support:
        "Toutes les lectures et les actions de support : accès offerts, appareils, suppressions, invitations, déconnexion, exports de données. Ni facturation ni rôles.",
      readonly:
        "Lectures seulement, sans la liste des membres ni les exports de données personnelles.",
    },
    sidebar: { role: "Rôle : {role}" },
    gate: {
      twoFactorTitle: "Code Authenticator obligatoire",
      twoFactorBody:
        "Chaque membre de l’administration doit protéger son compte avec une application Authenticator. Configure-la dans la sécurité de ton compte, puis reviens ici.",
      twoFactorAction: "Configurer l’Authenticator",
    },
    page: {
      eyebrow: "PRESSAY / MEMBRES",
      title: "Membres",
      detail:
        "Qui peut administrer Pressay, avec quel rôle. Réservé aux propriétaires ; chaque ajout ou changement de rôle est audité et signalé par une alerte.",
      ownerOnly:
        "Cette page est réservée aux propriétaires. Valide aussi ton code Authenticator dans le panneau de sécurité.",
      headers: ["Membre", "Rôle", "Authenticator", "Ajouté par", "Depuis", "Actions"],
      authenticatorOn: "Activé",
      authenticatorOff: "Non configuré : accès bloqué",
      authenticatorUnknown: "Inconnu",
      you: "toi",
      initial: "membre initial",
    },
    add: {
      title: "Ajouter un membre",
      description:
        "La personne doit d’abord se connecter une fois au site avec cette adresse vérifiée, puis configurer une application Authenticator.",
      email: "Adresse e-mail vérifiée",
      role: "Rôle",
      reason: "Motif",
      submit: "Ajouter",
      confirm: "Donner ce rôle à cette adresse ?",
    },
    change: {
      title: "Changer le rôle",
      role: "Nouveau rôle",
      reason: "Motif",
      submit: "Changer",
      confirm: "Changer le rôle de ce membre ?",
    },
    remove: {
      title: "Retirer",
      reason: "Motif",
      submit: "Retirer",
      confirm: "Retirer l’accès à l’administration de ce membre ?",
    },
    rules: {
      title: "Règles",
      lastOwner: "Il reste toujours au moins un propriétaire actif.",
      recovery:
        "Si plus aucun propriétaire n’existe, une adresse listée dans la configuration du serveur reprend le rôle à sa prochaine connexion (procédure de secours documentée).",
    },
  },
  en: {
    nav: { members: "Members" },
    roles: {
      owner: "Owner",
      support: "Support",
      readonly: "Read-only",
    },
    roleDetails: {
      owner:
        "Everything: billing (Stripe promotions, webhook replay, rewards), launch criteria and members.",
      support:
        "Every read and the support actions: offered access, devices, deletions, invitations, sign-out, data exports. Neither billing nor roles.",
      readonly:
        "Reads only, without the member list or personal-data exports.",
    },
    sidebar: { role: "Role: {role}" },
    gate: {
      twoFactorTitle: "Authenticator code required",
      twoFactorBody:
        "Every member of the administration must protect their account with an Authenticator app. Set it up in your account security, then come back here.",
      twoFactorAction: "Set up the Authenticator",
    },
    page: {
      eyebrow: "PRESSAY / MEMBERS",
      title: "Members",
      detail:
        "Who can administer Pressay, and with which role. Owners only; each addition or role change is audited and raises an alert.",
      ownerOnly:
        "This page is for owners. Also verify your Authenticator code in the security panel.",
      headers: ["Member", "Role", "Authenticator", "Added by", "Since", "Actions"],
      authenticatorOn: "Enabled",
      authenticatorOff: "Not set up: access blocked",
      authenticatorUnknown: "Unknown",
      you: "you",
      initial: "initial member",
    },
    add: {
      title: "Add a member",
      description:
        "The person must first sign in once on the site with this verified address, then set up an Authenticator app.",
      email: "Verified email address",
      role: "Role",
      reason: "Reason",
      submit: "Add",
      confirm: "Give this role to this address?",
    },
    change: {
      title: "Change role",
      role: "New role",
      reason: "Reason",
      submit: "Change",
      confirm: "Change this member's role?",
    },
    remove: {
      title: "Remove",
      reason: "Reason",
      submit: "Remove",
      confirm: "Remove this member's access to the administration?",
    },
    rules: {
      title: "Rules",
      lastOwner: "At least one active owner always remains.",
      recovery:
        "If no owner is left, an address listed in the server configuration takes the role at its next sign-in (documented recovery procedure).",
    },
  },
} satisfies Record<AdminLocale, unknown>;
