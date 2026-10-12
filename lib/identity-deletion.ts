import type { AppleRevocationResult, AppleToken } from "./apple.ts";

export type StoredAccount = {
  providerId: string;
  accessToken?: string | null;
  refreshToken?: string | null;
};

/** Narrow persistence surface so the deletion sequence is testable. */
export type IdentityStore = {
  userExists(userId: string): Promise<boolean>;
  findAccounts(userId: string): Promise<StoredAccount[]>;
  decryptToken(token: string): Promise<string>;
  /** Passkeys, two-factor secrets, OAuth tokens and consents. */
  deleteDependents(userId: string): Promise<void>;
  /** Sessions, linked accounts and the user row. */
  deleteUser(userId: string): Promise<void>;
};

export type DeletionLogger = (event: string, detail?: string) => void;

const silent: DeletionLogger = () => undefined;

/**
 * Tokens to revoke for Sign in with Apple. Revoking the refresh token ends the
 * whole authorization, so the access token is only used when no refresh
 * token was stored.
 */
export async function appleTokensFor(
  accounts: StoredAccount[],
  decrypt: (token: string) => Promise<string>,
): Promise<AppleToken[]> {
  const tokens: AppleToken[] = [];
  for (const account of accounts) {
    if (account.providerId !== "apple") continue;
    const encrypted = account.refreshToken || account.accessToken;
    if (!encrypted) continue;
    try {
      tokens.push({
        token: await decrypt(encrypted),
        hint: account.refreshToken ? "refresh_token" : "access_token",
      });
    } catch {
      // An undecryptable token cannot be revoked; deletion still proceeds.
    }
  }
  return tokens;
}

/**
 * Revoke Apple tokens (best effort) and remove every identity row that
 * Better Auth keeps for a user. Shared by the user-initiated deletion hook
 * (before Better Auth removes the user itself) and the Cloud-initiated
 * internal deletion endpoint.
 */
export async function revokeAndPurgeDependents(
  userId: string,
  store: IdentityStore,
  revokeApple: (tokens: AppleToken[]) => Promise<AppleRevocationResult>,
  log: DeletionLogger = silent,
): Promise<void> {
  const tokens = await appleTokensFor(
    await store.findAccounts(userId),
    (token) => store.decryptToken(token),
  );
  if (tokens.length) {
    try {
      const outcome = await revokeApple(tokens);
      for (const failure of outcome.failures)
        log("apple_token_revocation_failed", failure);
    } catch {
      log("apple_token_revocation_failed", "unexpected");
    }
  }
  await store.deleteDependents(userId);
}

/**
 * Idempotent full deletion used by the Cloud -> web internal endpoint.
 * It never calls the Cloud back (the Cloud initiated it).
 */
export async function deleteIdentity(
  userId: string,
  store: IdentityStore,
  revokeApple: (tokens: AppleToken[]) => Promise<AppleRevocationResult>,
  log: DeletionLogger = silent,
): Promise<{ deleted: boolean }> {
  if (!(await store.userExists(userId))) return { deleted: false };
  await revokeAndPurgeDependents(userId, store, revokeApple, log);
  await store.deleteUser(userId);
  return { deleted: true };
}
