"use client";

import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { authClient } from "@/lib/auth-client";
import {
  securityFailure,
  type SecurityFeedback,
} from "@/lib/security-feedback";

type BrowserSession = {
  id: string;
  token: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date | string;
};

export function AccountSecurity({
  initialSessions,
  locale = "fr",
}: {
  initialSessions: BrowserSession[];
  locale?: "fr" | "en";
}) {
  const tr = (fr: string, en: string) => (locale === "fr" ? fr : en);
  const session = authClient.useSession();
  const passkeys = authClient.useListPasskeys();
  const [pending, setPending] = useState("");
  type Section = "passkeys" | "totp" | "sessions";
  const [feedback, setFeedback] = useState<
    Partial<Record<Section, SecurityFeedback>>
  >({});
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [sessions, setSessions] = useState<BrowserSession[]>(initialSessions);

  const loadSessions = useCallback(async () => {
    const result = await authClient.listSessions();
    if (!result.error) setSessions(result.data);
  }, []);

  useEffect(() => {
    let active = true;
    void authClient
      .listSessions()
      .then((result) => {
        if (active && !result.error) setSessions(result.data);
      })
      .catch(() => {
        // Session-list availability must not block the security controls.
      });
    return () => {
      active = false;
    };
  }, []);

  function report(section: Section, value: SecurityFeedback) {
    setFeedback((previous) => ({ ...previous, [section]: value }));
  }

  async function run(
    action: string,
    section: Section,
    work: () => Promise<void>,
  ) {
    setPending(action);
    setFeedback((previous) => ({ ...previous, [section]: undefined }));
    try {
      await work();
    } catch (error) {
      report(section, securityFailure(error, locale));
    } finally {
      setPending("");
    }
  }

  function success(section: Section, fr: string, en: string) {
    report(section, { tone: "success", text: tr(fr, en) });
  }

  async function addPasskey() {
    await run("passkey", "passkeys", async () => {
      if (!window.PublicKeyCredential || !window.isSecureContext) {
        report("passkeys", {
          tone: "error",
          text: tr(
            "Les clés d’accès ne sont pas disponibles dans ce navigateur. Ouvre cette page en HTTPS dans Safari ou Chrome à jour.",
            "Passkeys are unavailable in this browser. Open this page over HTTPS in an up-to-date Safari or Chrome.",
          ),
        });
        return;
      }
      report("passkeys", {
        tone: "info",
        text: tr(
          "Confirme dans la fenêtre de ton navigateur avec Touch ID, ton téléphone ou une clé de sécurité. Cela peut prendre quelques instants.",
          "Confirm in your browser’s prompt using Touch ID, your phone or a security key. This may take a moment.",
        ),
      });
      const result = await authClient.passkey.addPasskey({
        name: `Pressay · ${new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date())}`,
      });
      if (result.error) throw result.error;
      success(
        "passkeys",
        "Clé d’accès enregistrée. Tu peux maintenant l’utiliser pour te connecter.",
        "Passkey registered. You can now use it to sign in.",
      );
      await passkeys.refetch();
    });
  }

  async function deletePasskey(id: string) {
    if (
      !window.confirm(
        tr("Supprimer cette clé d’accès ?", "Delete this passkey?"),
      )
    )
      return;
    await run(id, "passkeys", async () => {
      const result = await authClient.passkey.deletePasskey({ id });
      if (result.error) throw result.error;
      success("passkeys", "Clé d’accès supprimée.", "Passkey deleted.");
      await passkeys.refetch();
    });
  }

  async function beginTOTP() {
    await run("totp-enable", "totp", async () => {
      const result = await authClient.twoFactor.enable({});
      if (result.error) throw result.error;
      if (result.data.method !== "totp") throw new Error("totp_unavailable");
      setTotpURI(result.data.totpURI);
      setBackupCodes(result.data.backupCodes);
      report("totp", {
        tone: "info",
        text: tr(
          "Dernière étape : saisis le code à 6 chiffres pour confirmer l’activation.",
          "Final step: enter the 6-digit code to confirm activation.",
        ),
      });
    });
  }

  async function verifyTOTP(formData: FormData) {
    await run("totp-verify", "totp", async () => {
      const code = String(formData.get("code") ?? "").replace(/[\s-]/g, "");
      const result = await authClient.twoFactor.verifyTotp({
        code,
        trustDevice: false,
      });
      if (result.error) throw result.error;
      setTotpURI("");
      success(
        "totp",
        "Authenticator activé et vérifié. Conserve tes codes de secours hors ligne.",
        "Authenticator enabled and verified. Keep your backup codes offline.",
      );
      await session.refetch();
    });
  }

  async function regenerateBackupCodes() {
    if (
      !window.confirm(
        tr(
          "Les anciens codes de secours seront invalidés. Continuer ?",
          "Your old backup codes will be invalidated. Continue?",
        ),
      )
    )
      return;
    await run("backup", "totp", async () => {
      const result = await authClient.twoFactor.generateBackupCodes({});
      if (result.error) throw result.error;
      setBackupCodes(result.data.backupCodes);
      success(
        "totp",
        "Nouveaux codes créés. Les anciens codes ne sont plus valides.",
        "New backup codes created. Previous codes are no longer valid.",
      );
    });
  }

  async function disableTOTP() {
    if (
      !window.confirm(
        tr("Désactiver la validation TOTP ?", "Disable TOTP verification?"),
      )
    )
      return;
    await run("totp-disable", "totp", async () => {
      const result = await authClient.twoFactor.disable({});
      if (result.error) throw result.error;
      setBackupCodes([]);
      success("totp", "Authenticator désactivé.", "Authenticator disabled.");
      await session.refetch();
    });
  }

  const twoFactorEnabled = session.data?.user.twoFactorEnabled === true;
  async function revokeSession(token: string) {
    await run(token, "sessions", async () => {
      const result = await authClient.revokeSession({ token });
      if (result.error) throw result.error;
      success("sessions", "Session révoquée.", "Session revoked.");
      await loadSessions();
    });
  }

  async function signOut(
    reauthenticate = false,
    section: Section = "sessions",
  ) {
    await run("signout", section, async () => {
      const result = await authClient.signOut();
      if (result.error) throw result.error;
      window.location.assign(
        reauthenticate
          ? `/sign-in?locale=${locale}&redirect_url=%2Faccount%2Fsecurity`
          : `/${locale}`,
      );
    });
  }

  function notice(section: Section) {
    const value = feedback[section];
    return value ? (
      <div className={`security-feedback security-feedback--${value.tone}`}>
        <p role={value.tone === "error" ? "alert" : "status"}>{value.text}</p>
        {value.reauthenticate ? (
          <button
            className="button button-small"
            disabled={Boolean(pending)}
            onClick={() => signOut(true, section)}
          >
            {tr("Se reconnecter pour continuer", "Sign in again to continue")}
          </button>
        ) : null}
      </div>
    ) : null;
  }

  return (
    <div className="security-settings">
      <section
        className="security-setting-card"
        aria-labelledby="passkeys-title"
      >
        <span className="mono-label">PASSKEY / WEBAUTHN</span>
        <h2 id="passkeys-title">{tr("Clés d’accès", "Passkeys")}</h2>
        <p>
          {tr(
            "Utilise Touch ID ou une clé de sécurité. La clé privée ne quitte jamais ton appareil.",
            "Use Touch ID or a security key. Your private key never leaves your device.",
          )}
        </p>
        {passkeys.isPending ? (
          <p role="status">{tr("Chargement des clés…", "Loading passkeys…")}</p>
        ) : passkeys.error ? (
          <p role="alert">
            {tr(
              "Impossible de charger tes clés d’accès. Recharge la page pour réessayer.",
              "Unable to load your passkeys. Reload the page to retry.",
            )}
          </p>
        ) : null}
        <div className="security-key-list">
          {passkeys.data?.map((key) => (
            <div key={key.id}>
              <span>
                <strong>{key.name || tr("Clé d’accès", "Passkey")}</strong>
                <small>
                  {tr("Ajoutée le", "Added on")}{" "}
                  {formatDate(key.createdAt, locale)}
                </small>
              </span>
              <button
                className="account-link-button danger"
                disabled={pending === key.id}
                onClick={() => deletePasskey(key.id)}
              >
                {tr("Supprimer", "Delete")}
              </button>
            </div>
          ))}
          {!passkeys.isPending && !passkeys.error && !passkeys.data?.length ? (
            <p>{tr("Aucune clé enregistrée.", "No passkeys registered.")}</p>
          ) : null}
        </div>
        <button
          className="button button-primary"
          disabled={Boolean(pending)}
          onClick={addPasskey}
        >
          {pending === "passkey"
            ? tr("Enregistrement…", "Registering…")
            : tr("Ajouter une clé d’accès", "Add a passkey")}
        </button>
        {notice("passkeys")}
      </section>

      <section className="security-setting-card" aria-labelledby="totp-title">
        <span className="mono-label">TOTP / ADMIN STEP-UP</span>
        <h2 id="totp-title">
          {tr("Application Authenticator", "Authenticator app")}
        </h2>
        <p
          className={`security-state ${twoFactorEnabled ? "security-state--active" : ""}`}
          role="status"
        >
          {session.isPending
            ? tr("Vérification de l’état…", "Checking status…")
            : session.error
              ? tr("État indisponible", "Status unavailable")
              : twoFactorEnabled
                ? tr("✓ Activé et vérifié", "✓ Enabled and verified")
                : totpURI
                  ? tr(
                      "Activation à confirmer",
                      "Activation awaiting confirmation",
                    )
                  : tr("Non configuré", "Not configured")}
        </p>
        <p>
          {tr(
            "Une fois activé, Authenticator reste configuré sur ton compte. Dans l’administration, un nouveau code autorise les actions sensibles pendant 10 minutes. Google conserve ses propres règles de connexion.",
            "Once enabled, Authenticator stays configured on your account. In administration, a new code authorizes sensitive actions for 10 minutes. Google keeps its own sign-in rules.",
          )}
        </p>
        {!session.isPending &&
        !session.error &&
        !twoFactorEnabled &&
        !totpURI ? (
          <button
            className="button"
            disabled={Boolean(pending)}
            onClick={beginTOTP}
          >
            {pending === "totp-enable"
              ? tr("Préparation…", "Preparing…")
              : tr("Configurer une application", "Set up an authenticator")}
          </button>
        ) : null}
        {totpURI ? (
          <div className="totp-enrollment">
            <QRCodeSVG
              value={totpURI}
              size={184}
              bgColor="#ffffff"
              fgColor="#111016"
              level="M"
            />
            <a href={totpURI}>
              {tr(
                "Ouvrir dans l’application Authenticator",
                "Open in your authenticator app",
              )}
            </a>
            <form action={verifyTOTP}>
              <label>
                {tr("Code à 6 chiffres", "6-digit code")}
                <input
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9 ]{6,8}"
                  required
                />
              </label>
              <button
                className="button button-primary"
                disabled={Boolean(pending)}
              >
                {pending === "totp-verify"
                  ? tr("Vérification…", "Verifying…")
                  : tr("Valider et activer", "Verify and enable")}
              </button>
            </form>
          </div>
        ) : null}
        {twoFactorEnabled ? (
          <div className="account-actions">
            <button
              className="button button-small"
              disabled={Boolean(pending)}
              onClick={regenerateBackupCodes}
            >
              {tr("Nouveaux codes de secours", "New backup codes")}
            </button>
            <button
              className="account-link-button danger"
              disabled={Boolean(pending)}
              onClick={disableTOTP}
            >
              {tr("Désactiver TOTP", "Disable TOTP")}
            </button>
          </div>
        ) : null}
        {notice("totp")}
        {backupCodes.length ? (
          <BackupCodes codes={backupCodes} locale={locale} />
        ) : null}
      </section>
      <section className="security-setting-card">
        <span className="mono-label">SESSIONS / RÉVOCATION</span>
        <h2>{tr("Appareils connectés", "Browser sessions")}</h2>
        <p>
          {tr(
            "Révoquer une session web prend effet immédiatement. Gère tes Mac depuis l’onglet Appareils.",
            "Revoking a browser session takes effect immediately. Manage your Macs from the Devices tab.",
          )}
        </p>
        <div className="security-key-list">
          {sessions.map((item) => (
            <div key={item.id}>
              <span>
                <strong>
                  {item.id === session.data?.session.id
                    ? tr("Session actuelle", "Current session")
                    : browserName(item.userAgent, locale)}
                </strong>
                <small>
                  {formatDate(item.createdAt, locale)}
                  {item.ipAddress ? ` · ${item.ipAddress}` : ""}
                </small>
              </span>
              {item.id === session.data?.session.id ? null : (
                <button
                  className="account-link-button danger"
                  disabled={pending === item.token}
                  onClick={() => revokeSession(item.token)}
                >
                  {tr("Révoquer", "Revoke")}
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          className="account-link-button danger"
          disabled={Boolean(pending)}
          onClick={() => signOut()}
        >
          {tr("Se déconnecter de cette session", "Sign out of this session")}
        </button>
        {notice("sessions")}
      </section>
    </div>
  );
}

function BackupCodes({
  codes,
  locale,
}: {
  codes: string[];
  locale: "fr" | "en";
}) {
  async function copy() {
    await navigator.clipboard.writeText(codes.join("\n"));
  }
  return (
    <div className="backup-codes">
      <strong>
        {locale === "fr"
          ? "Codes de secours — affichés une seule fois"
          : "Backup codes — shown only once"}
      </strong>
      <div>
        {codes.map((code) => (
          <code key={code}>{code}</code>
        ))}
      </div>
      <button className="button button-small" onClick={copy}>
        {locale === "fr" ? "Copier les codes" : "Copy codes"}
      </button>
    </div>
  );
}

function formatDate(value: Date | string | undefined, locale = "fr"): string {
  return value
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        new Date(value),
      )
    : locale === "fr"
      ? "date inconnue"
      : "unknown date";
}

function browserName(
  userAgent: string | null | undefined,
  locale: "fr" | "en",
): string {
  if (!userAgent)
    return locale === "fr" ? "Navigateur inconnu" : "Unknown browser";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Safari")) return "Safari";
  return locale === "fr" ? "Navigateur web" : "Web browser";
}
