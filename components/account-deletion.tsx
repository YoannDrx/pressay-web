"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  ACKNOWLEDGE_APPLE_SUBSCRIPTION,
  APPLE_SUBSCRIPTIONS_URL,
} from "@/lib/account-deletion";

type Step =
  | { kind: "idle" }
  | { kind: "confirm"; resumed: boolean }
  | { kind: "reauthenticate"; providers: ("apple" | "google")[]; passkey: boolean }
  | { kind: "apple_subscription" }
  | { kind: "error"; text: string };

export const DELETE_RESUME_INTENT = "delete-account";
const RESUME_URL = `/account/security?resume=${DELETE_RESUME_INTENT}`;

export function AccountDeletion({ locale }: { locale: "fr" | "en" }) {
  const fr = locale === "fr";
  const tr = (french: string, english: string) => (fr ? french : english);
  const session = authClient.useSession();
  // Back from re-authentication: ask again, explicitly, before deleting.
  const resumed = useSearchParams().get("resume") === DELETE_RESUME_INTENT;
  const [step, setStep] = useState<Step>(
    resumed ? { kind: "confirm", resumed: true } : { kind: "idle" },
  );
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!resumed) return;
    // Drop the intent so a reload does not reopen the confirmation.
    const params = new URLSearchParams(window.location.search);
    params.delete("resume");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (query ? `?${query}` : ""),
    );
  }, [resumed]);

  async function reauthenticationOptions(): Promise<Step> {
    const [accounts, passkeys] = await Promise.all([
      authClient.listAccounts().catch(() => null),
      authClient.passkey.listUserPasskeys().catch(() => null),
    ]);
    const linked = (accounts?.data ?? [])
      .map((account) => account.providerId)
      .filter(
        (provider): provider is "apple" | "google" =>
          provider === "apple" || provider === "google",
      );
    return {
      kind: "reauthenticate",
      providers: linked.length ? Array.from(new Set(linked)) : ["apple", "google"],
      passkey: Boolean(passkeys?.data?.length),
    };
  }

  async function remove(acknowledgeAppleSubscription = false) {
    setPending(true);
    try {
      const result = await authClient.deleteUser({
        callbackURL: `/${locale}`,
        fetchOptions: acknowledgeAppleSubscription
          ? { query: { [ACKNOWLEDGE_APPLE_SUBSCRIPTION]: "true" } }
          : undefined,
      });
      if (!result.error) {
        // Full reload: every cached view of the deleted account must go.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`/${locale}`);
        return;
      }
      const code = result.error.code;
      const status = result.error.status;
      if (
        code === "SESSION_EXPIRED" ||
        code === "SESSION_NOT_FRESH" ||
        status === 401
      ) {
        setStep(await reauthenticationOptions());
      } else if (code === "APPLE_SUBSCRIPTION_ACTIVE" || status === 409) {
        setStep({ kind: "apple_subscription" });
      } else if (status === 429) {
        setStep({
          kind: "error",
          text: tr(
            "Trop de tentatives. Patiente une minute avant de réessayer.",
            "Too many attempts. Wait a minute before retrying.",
          ),
        });
      } else {
        setStep({
          kind: "error",
          text: tr(
            "La suppression n’a pas pu aboutir : le nettoyage de tes données Cloud est momentanément indisponible. Rien n’a été supprimé. Réessaie dans quelques minutes ou contacte le support.",
            "Deletion could not complete: Cloud data cleanup is temporarily unavailable. Nothing was deleted. Try again in a few minutes or contact support.",
          ),
        });
      }
    } catch {
      setStep({
        kind: "error",
        text: tr(
          "Connexion interrompue. Rien n’a été supprimé. Vérifie ta connexion puis réessaie.",
          "Connection lost. Nothing was deleted. Check your connection and retry.",
        ),
      });
    } finally {
      setPending(false);
    }
  }

  async function reauthenticateWith(provider: "apple" | "google") {
    setPending(true);
    const result = await authClient.signIn
      .social({
        provider,
        callbackURL: RESUME_URL,
        errorCallbackURL: `/sign-in?locale=${locale}&redirect_url=${encodeURIComponent(RESUME_URL)}`,
      })
      .catch(() => null);
    if (!result || result.error) {
      setPending(false);
      setStep({
        kind: "error",
        text: tr(
          "La reconnexion n’a pas pu démarrer. Réessaie.",
          "Sign-in could not start. Please retry.",
        ),
      });
    }
  }

  async function reauthenticateWithPasskey() {
    setPending(true);
    const result = await authClient.signIn
      .passkey({ fetchOptions: { throw: false } })
      .catch(() => null);
    setPending(false);
    if (!result || result.error) {
      setStep({
        kind: "error",
        text: tr(
          "Aucune clé d’accès valide n’a été présentée.",
          "No valid passkey was provided.",
        ),
      });
      return;
    }
    await session.refetch();
    setStep({ kind: "confirm", resumed: true });
  }

  const email = session.data?.user.email;
  return (
    <div className="account-deletion">
      {step.kind === "idle" || step.kind === "error" ? (
        <button
          className="button button-small"
          disabled={pending}
          onClick={() => setStep({ kind: "confirm", resumed: false })}
        >
          {tr("Supprimer mon compte", "Delete my account")}
        </button>
      ) : null}
      {step.kind === "error" ? <p role="alert">{step.text}</p> : null}
      {step.kind === "confirm" ? (
        <div className="account-deletion-panel" role="alertdialog" aria-labelledby="delete-title">
          <strong id="delete-title">
            {step.resumed
              ? tr("Connexion confirmée.", "Sign-in confirmed.")
              : tr("Supprimer définitivement ton compte ?", "Permanently delete your account?")}
          </strong>
          <p>
            {email
              ? tr(
                  `Le compte ${email}, ses accès Cloud, appareils, clés d’accès et autorisations seront supprimés. Tes données locales sur le Mac ne sont pas touchées.`,
                  `The account ${email}, its Cloud access, devices, passkeys and authorizations will be deleted. Local data on your Mac is not affected.`,
                )
              : tr(
                  "Ton compte, ses accès Cloud, appareils, clés d’accès et autorisations seront supprimés. Tes données locales sur le Mac ne sont pas touchées.",
                  "Your account, its Cloud access, devices, passkeys and authorizations will be deleted. Local data on your Mac is not affected.",
                )}
          </p>
          <div className="account-actions">
            <button className="button button-small danger" disabled={pending} onClick={() => remove()}>
              {pending ? "…" : tr("Supprimer définitivement", "Delete permanently")}
            </button>
            <button className="button button-small" disabled={pending} onClick={() => setStep({ kind: "idle" })}>
              {tr("Annuler", "Cancel")}
            </button>
          </div>
        </div>
      ) : null}
      {step.kind === "reauthenticate" ? (
        <div className="account-deletion-panel" role="alert">
          <strong>{tr("Confirme ton identité.", "Confirm it’s you.")}</strong>
          <p>
            {tr(
              "Pour protéger ton compte, la suppression exige une connexion de moins de 10 minutes. Reconnecte-toi : tu reviendras ici pour confirmer la suppression.",
              "To protect your account, deletion requires a sign-in from the last 10 minutes. Sign in again: you’ll come back here to confirm the deletion.",
            )}
          </p>
          <div className="account-actions">
            {step.providers.map((provider) => (
              <button
                key={provider}
                className="button button-small"
                disabled={pending}
                onClick={() => reauthenticateWith(provider)}
              >
                {provider === "apple"
                  ? tr("Confirmer avec Apple", "Confirm with Apple")
                  : tr("Confirmer avec Google", "Confirm with Google")}
              </button>
            ))}
            {step.passkey ? (
              <button className="button button-small" disabled={pending} onClick={reauthenticateWithPasskey}>
                {tr("Confirmer avec une passkey", "Confirm with a passkey")}
              </button>
            ) : null}
            <button className="button button-small" disabled={pending} onClick={() => setStep({ kind: "idle" })}>
              {tr("Annuler", "Cancel")}
            </button>
          </div>
        </div>
      ) : null}
      {step.kind === "apple_subscription" ? (
        <div className="account-deletion-panel" role="alert">
          <strong>{tr("Un abonnement Apple est encore actif.", "An Apple subscription is still active.")}</strong>
          <p>
            {tr(
              "Supprimer ton compte n’arrête pas la facturation Apple. Annule d’abord l’abonnement dans les réglages de ton compte Apple, sinon il continuera d’être renouvelé.",
              "Deleting your account does not stop Apple billing. Cancel the subscription in your Apple account settings first, otherwise it will keep renewing.",
            )}
          </p>
          <div className="account-actions">
            <a className="button button-small" href={APPLE_SUBSCRIPTIONS_URL} target="_blank" rel="noreferrer">
              {tr("Gérer mes abonnements Apple", "Manage Apple subscriptions")}
            </a>
            <button className="button button-small danger" disabled={pending} onClick={() => remove(true)}>
              {pending ? "…" : tr("Supprimer quand même", "Delete anyway")}
            </button>
            <button className="button button-small" disabled={pending} onClick={() => setStep({ kind: "idle" })}>
              {tr("Annuler", "Cancel")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
