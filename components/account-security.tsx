"use client";

import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { authClient } from "@/lib/auth-client";

type BrowserSession = { id: string; token: string; userAgent?: string | null; ipAddress?: string | null; createdAt: Date | string };

export function AccountSecurity({ initialSessions }: { initialSessions: BrowserSession[] }) {
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
    return () => { active = false; };
  }, []);

  async function addPasskey() {
    setPending("passkey"); setMessage("");
    const result = await authClient.passkey.addPasskey({
      name: `Mac · ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date())}`,
      authenticatorAttachment: "platform"
    });
    setPending("");
    setMessage(result.error ? "La clé d’accès n’a pas pu être enregistrée." : "Clé d’accès enregistrée.");
    if (!result.error) await passkeys.refetch();
  }

  async function deletePasskey(id: string) {
    if (!window.confirm("Supprimer cette clé d’accès ?")) return;
    setPending(id); setMessage("");
    const result = await authClient.passkey.deletePasskey({ id });
    setPending("");
    setMessage(result.error ? "Suppression impossible." : "Clé d’accès supprimée.");
    if (!result.error) await passkeys.refetch();
  }

  async function beginTOTP() {
    setPending("totp-enable"); setMessage("");
    const result = await authClient.twoFactor.enable({});
    setPending("");
    if (result.error) {
      setMessage("L’activation TOTP n’a pas abouti.");
      return;
    }
    if (result.data.method !== "totp") {
      setMessage("Le serveur n’a pas proposé de configuration TOTP.");
      return;
    }
    setTotpURI(result.data.totpURI);
    setBackupCodes(result.data.backupCodes);
  }

  async function verifyTOTP(formData: FormData) {
    const code = String(formData.get("code") ?? "").replace(/[\s-]/g, "");
    setPending("totp-verify"); setMessage("");
    const result = await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
    setPending("");
    if (result.error) {
      setMessage("Code incorrect. Vérifie l’heure de ton appareil puis réessaie.");
      return;
    }
    setTotpURI("");
    setMessage("Validation TOTP activée. Conserve les codes de secours hors ligne.");
    await session.refetch();
  }

  async function regenerateBackupCodes() {
    if (!window.confirm("Les anciens codes de secours seront invalidés. Continuer ?")) return;
    setPending("backup"); setMessage("");
    const result = await authClient.twoFactor.generateBackupCodes({});
    setPending("");
    if (result.error) setMessage("Impossible de régénérer les codes.");
    else setBackupCodes(result.data.backupCodes);
  }

  async function disableTOTP() {
    if (!window.confirm("Désactiver la validation TOTP ?")) return;
    setPending("totp-disable"); setMessage("");
    const result = await authClient.twoFactor.disable({});
    setPending("");
    setMessage(result.error ? "Désactivation impossible." : "Validation TOTP désactivée.");
    if (!result.error) {
      setBackupCodes([]);
      await session.refetch();
    }
  }

  const twoFactorEnabled = session.data?.user.twoFactorEnabled === true;
  async function revokeSession(token: string) {
    setPending(token); setMessage("");
    const result = await authClient.revokeSession({ token });
    setPending("");
    setMessage(result.error ? "Cette session n’a pas pu être révoquée." : "Session révoquée.");
    if (!result.error) await loadSessions();
  }

  async function signOut() {
    await authClient.signOut();
    window.location.assign("/fr");
  }

  return <div className="security-settings">
    <section className="security-setting-card">
      <span className="mono-label">PASSKEY / WEBAUTHN</span>
      <h1>Clés d’accès</h1>
      <p>Utilise Touch ID ou une clé de sécurité. La clé privée ne quitte jamais ton appareil.</p>
      <div className="security-key-list">
        {passkeys.data?.map((key) => <div key={key.id}><span><strong>{key.name || "Clé d’accès"}</strong><small>Ajoutée le {formatDate(key.createdAt)}</small></span><button className="account-link-button danger" disabled={pending === key.id} onClick={() => deletePasskey(key.id)}>Supprimer</button></div>)}
        {!passkeys.isPending && !passkeys.data?.length ? <p>Aucune clé enregistrée.</p> : null}
      </div>
      <button className="button button-primary" disabled={Boolean(pending)} onClick={addPasskey}>{pending === "passkey" ? "Enregistrement…" : "Ajouter une clé d’accès"}</button>
    </section>

    <section className="security-setting-card">
      <span className="mono-label">TOTP / ADMIN STEP-UP</span>
      <h2>Validation forte TOTP</h2>
      <p>Un code d’application Authenticator est exigé avant chaque opération administrative sensible. Google conserve ses propres règles de connexion ; une passkey fournit une connexion résistante au phishing.</p>
      {!twoFactorEnabled && !totpURI ? <button className="button" disabled={Boolean(pending)} onClick={beginTOTP}>{pending === "totp-enable" ? "Préparation…" : "Configurer une application"}</button> : null}
      {totpURI ? <div className="totp-enrollment">
        <QRCodeSVG value={totpURI} size={184} bgColor="#ffffff" fgColor="#111016" level="M" />
        <a href={totpURI}>Ouvrir dans l’application Authenticator</a>
        <form action={verifyTOTP}><label>Code à 6 chiffres<input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,8}" required /></label><button className="button button-primary" disabled={Boolean(pending)}>{pending === "totp-verify" ? "Vérification…" : "Valider et activer"}</button></form>
      </div> : null}
      {twoFactorEnabled ? <div className="account-actions"><button className="button button-small" disabled={Boolean(pending)} onClick={regenerateBackupCodes}>Nouveaux codes de secours</button><button className="account-link-button danger" disabled={Boolean(pending)} onClick={disableTOTP}>Désactiver TOTP</button></div> : null}
      {backupCodes.length ? <BackupCodes codes={backupCodes} /> : null}
    </section>
    <section className="security-setting-card">
      <span className="mono-label">SESSIONS / RÉVOCATION</span>
      <h2>Appareils connectés</h2>
      <p>Révoquer une session web prend effet immédiatement. Les sessions OAuth macOS sont aussi révocables depuis l’administration.</p>
      <div className="security-key-list">{sessions.map((item) => <div key={item.id}><span><strong>{item.id === session.data?.session.id ? "Session actuelle" : browserName(item.userAgent)}</strong><small>{formatDate(item.createdAt)}{item.ipAddress ? ` · ${item.ipAddress}` : ""}</small></span>{item.id === session.data?.session.id ? null : <button className="account-link-button danger" disabled={pending === item.token} onClick={() => revokeSession(item.token)}>Révoquer</button>}</div>)}</div>
      <button className="account-link-button danger" onClick={signOut}>Se déconnecter de cette session</button>
    </section>
    {message ? <output className="auth-message" role="status">{message}</output> : null}
  </div>;
}

function BackupCodes({ codes }: { codes: string[] }) {
  async function copy() { await navigator.clipboard.writeText(codes.join("\n")); }
  return <div className="backup-codes"><strong>Codes de secours — affichés une seule fois</strong><div>{codes.map((code) => <code key={code}>{code}</code>)}</div><button className="button button-small" onClick={copy}>Copier les codes</button></div>;
}

function formatDate(value: Date | string | undefined): string {
  return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value)) : "date inconnue";
}

function browserName(userAgent: string | null | undefined): string {
  if (!userAgent) return "Navigateur inconnu";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Safari")) return "Safari";
  return "Navigateur web";
}
