"use client";

import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { authClient } from "@/lib/auth-client";

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
  const [message, setMessage] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [sessions, setSessions] = useState<BrowserSession[]>(initialSessions);

  const loadSessions = useCallback(async () => {
    const result = await authClient.listSessions();
    if (!result.error) setSessions(result.data);
  }, []);

  useEffect(() => {
    let active = true;
    void authClient.listSessions().then((result) => {
      if (active && !result.error) setSessions(result.data);
    });
    return () => {
      active = false;
    };
  }, []);

  async function addPasskey() {
    setPending("passkey");
    setMessage("");
    const result = await authClient.passkey.addPasskey({
      name: `Mac · ${new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date())}`,
      authenticatorAttachment: "platform",
    });
    setPending("");
    setMessage(
      result.error
        ? tr(
            "La clé d’accès n’a pas pu être enregistrée.",
            "Unable to register the passkey.",
          )
        : tr("Clé d’accès enregistrée.", "Passkey registered."),
    );
    if (!result.error) await passkeys.refetch();
  }

  async function deletePasskey(id: string) {
    if (
      !window.confirm(
        tr("Supprimer cette clé d’accès ?", "Delete this passkey?"),
      )
    )
      return;
    setPending(id);
    setMessage("");
    const result = await authClient.passkey.deletePasskey({ id });
    setPending("");
    setMessage(
      result.error
        ? tr("Suppression impossible.", "Unable to delete.")
        : tr("Clé d’accès supprimée.", "Passkey deleted."),
    );
    if (!result.error) await passkeys.refetch();
  }

  async function beginTOTP() {
    setPending("totp-enable");
    setMessage("");
    const result = await authClient.twoFactor.enable({});
    setPending("");
    if (result.error) {
      setMessage(
        tr("L’activation TOTP n’a pas abouti.", "Unable to enable TOTP."),
      );
      return;
    }
    if (result.data.method !== "totp") {
      setMessage(
        tr(
          "Le serveur n’a pas proposé de configuration TOTP.",
          "TOTP setup is unavailable.",
        ),
      );
      return;
    }
    setTotpURI(result.data.totpURI);
    setBackupCodes(result.data.backupCodes);
  }

  async function verifyTOTP(formData: FormData) {
    const code = String(formData.get("code") ?? "").replace(/[\s-]/g, "");
    setPending("totp-verify");
    setMessage("");
    const result = await authClient.twoFactor.verifyTotp({
      code,
      trustDevice: false,
    });
    setPending("");
    if (result.error) {
      setMessage(
        tr(
          "Code incorrect. Vérifie l’heure de ton appareil puis réessaie.",
          "Incorrect code. Check your device clock and try again.",
        ),
      );
      return;
    }
    setTotpURI("");
    setMessage(
      tr(
        "Validation TOTP activée. Conserve les codes de secours hors ligne.",
        "TOTP enabled. Keep your backup codes offline.",
      ),
    );
    await session.refetch();
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
    setPending("backup");
    setMessage("");
    const result = await authClient.twoFactor.generateBackupCodes({});
    setPending("");
    if (result.error)
      setMessage(
        tr("Impossible de régénérer les codes.", "Unable to regenerate codes."),
      );
    else setBackupCodes(result.data.backupCodes);
  }

  async function disableTOTP() {
    if (
      !window.confirm(
        tr("Désactiver la validation TOTP ?", "Disable TOTP verification?"),
      )
    )
      return;
    setPending("totp-disable");
    setMessage("");
    const result = await authClient.twoFactor.disable({});
    setPending("");
    setMessage(
      result.error
        ? tr("Désactivation impossible.", "Unable to disable TOTP.")
        : tr("Validation TOTP désactivée.", "TOTP disabled."),
    );
    if (!result.error) {
      setBackupCodes([]);
      await session.refetch();
    }
  }

  const twoFactorEnabled = session.data?.user.twoFactorEnabled === true;
  async function revokeSession(token: string) {
    setPending(token);
    setMessage("");
    const result = await authClient.revokeSession({ token });
    setPending("");
    setMessage(
      result.error
        ? tr(
            "Cette session n’a pas pu être révoquée.",
            "Unable to revoke this session.",
          )
        : tr("Session révoquée.", "Session revoked."),
    );
    if (!result.error) await loadSessions();
  }

  async function signOut() {
    await authClient.signOut();
    window.location.assign(`/${locale}`);
  }

  return (
    <div className="security-settings">
      <section className="security-setting-card">
        <span className="mono-label">PASSKEY / WEBAUTHN</span>
        <h1>{tr("Clés d’accès", "Passkeys")}</h1>
        <p>
          {tr(
            "Utilise Touch ID ou une clé de sécurité. La clé privée ne quitte jamais ton appareil.",
            "Use Touch ID or a security key. Your private key never leaves your device.",
          )}
        </p>
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
          {!passkeys.isPending && !passkeys.data?.length ? (
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
      </section>

      <section className="security-setting-card">
        <span className="mono-label">TOTP / ADMIN STEP-UP</span>
        <h2>{tr("Validation forte TOTP", "Authenticator verification")}</h2>
        <p>
          {tr(
            "Un code d’application Authenticator est exigé avant chaque opération administrative sensible. Google conserve ses propres règles de connexion ; une passkey fournit une connexion résistante au phishing.",
            "An authenticator code is required before sensitive administrative actions. You can also protect your sign-in with two-factor authentication.",
          )}
        </p>
        {!twoFactorEnabled && !totpURI ? (
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
        <button className="account-link-button danger" onClick={signOut}>
          {tr("Se déconnecter de cette session", "Sign out of this session")}
        </button>
      </section>
      {message ? (
        <output className="auth-message" role="status">
          {message}
        </output>
      ) : null}
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
