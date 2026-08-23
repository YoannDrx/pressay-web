export type AccountView = {
  email: string;
  displayName: string | null;
  plan: "free" | "pro";
  source: "none" | "stripe" | "app_store" | "support" | "legacy";
  status: string | null;
  accessEndsAt: string | null;
  subscriptionEndsAt: string | null;
  offlineValidUntil: string | null;
  deviceLimit: number;
  canManageBilling: boolean;
};

type ModernMe = {
  email: string;
  entitlement: {
    tier: "free" | "pro";
    source: "none" | "trial" | "stripe" | "app_store" | "support";
    validUntil: string | null;
    offlineGraceUntil: string | null;
  };
};

type ModernBilling = {
  provider: "stripe" | "app_store" | null;
  status: string | null;
  currentPeriodEndsAt: string | null;
};

type LegacyMe = {
  account: {
    email: string;
    display_name: string | null;
  };
};

type LegacyEntitlement = {
  effectivePlan: string;
  effectiveSource: string;
  status: string;
  grantEnd: string | null;
  subscriptionEnd: string | null;
  offlineValidUntil: string | null;
  deviceLimit: number;
};

export function modernAccountView(
  me: ModernMe,
  billing: ModernBilling,
  identityName: string | null,
): AccountView {
  const entitlementSource = me.entitlement.source;
  return {
    email: me.email,
    displayName: identityName,
    plan: me.entitlement.tier,
    source:
      entitlementSource === "trial"
        ? "legacy"
        : entitlementSource,
    status: billing.status,
    accessEndsAt:
      entitlementSource === "support" || entitlementSource === "trial"
        ? me.entitlement.validUntil
        : null,
    subscriptionEndsAt: billing.currentPeriodEndsAt,
    offlineValidUntil: me.entitlement.offlineGraceUntil,
    deviceLimit: 3,
    canManageBilling: billing.provider === "stripe",
  };
}

export function legacyAccountView(
  me: LegacyMe,
  entitlement: LegacyEntitlement,
): AccountView {
  return {
    email: me.account.email,
    displayName: me.account.display_name,
    plan: entitlement.effectivePlan === "free" ? "free" : "pro",
    source: legacySource(entitlement.effectiveSource),
    status: entitlement.status,
    accessEndsAt: entitlement.grantEnd,
    subscriptionEndsAt: entitlement.subscriptionEnd,
    offlineValidUntil: entitlement.offlineValidUntil,
    deviceLimit: entitlement.deviceLimit,
    canManageBilling: entitlement.subscriptionEnd !== null,
  };
}

function legacySource(source: string): AccountView["source"] {
  if (source === "stripe") return "stripe";
  if (source === "app_store") return "app_store";
  if (source === "grant" || source === "support") return "support";
  if (source === "none") return "none";
  return "legacy";
}

export function planLabel(plan: AccountView["plan"]): string {
  return plan === "pro" ? "Pressay Pro" : "Pressay Free";
}

export function statusLabel(view: AccountView): string {
  if (view.plan === "free") return "Gratuit";
  switch (view.status) {
    case "active":
      return "Actif";
    case "trialing":
      return "Accès temporaire actif";
    case "past_due":
      return "Paiement à régulariser";
    case "grace":
      return "Délai de paiement";
    case "paused":
      return "Suspendu";
    case "canceled":
      return "Résilié à échéance";
    case "refunded":
      return "Remboursé";
    case "expired":
      return "Expiré";
    default:
      return "Actif";
  }
}

export function sourceLabel(source: AccountView["source"]): string {
  switch (source) {
    case "stripe":
      return "Abonnement direct Stripe";
    case "app_store":
      return "Abonnement Mac App Store";
    case "support":
      return "Accès accordé par Pressay";
    case "legacy":
      return "Accès historique conservé";
    default:
      return "Dictée locale gratuite";
  }
}
