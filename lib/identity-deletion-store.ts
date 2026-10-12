import "server-only";
import { decryptOAuthToken } from "better-auth/oauth2";
import { auth } from "@/lib/auth";
import { revokeAppleTokens } from "@/lib/apple";
import {
  deleteIdentity,
  revokeAndPurgeDependents,
  type IdentityStore,
} from "@/lib/identity-deletion";

// Rows that reference the user besides sessions and linked accounts. Delete
// them explicitly so deletion does not depend on foreign-key cascades in the
// production schema. Access tokens reference refresh tokens: delete first.
const dependentModels = [
  "passkey",
  "twoFactor",
  "oauthAccessToken",
  "oauthRefreshToken",
  "oauthConsent",
] as const;

async function identityStore(): Promise<IdentityStore> {
  const context = await auth.$context;
  return {
    async userExists(userId) {
      return Boolean(await context.internalAdapter.findUserById(userId));
    },
    async findAccounts(userId) {
      return context.internalAdapter.findAccounts(userId);
    },
    async decryptToken(token) {
      return decryptOAuthToken(
        token,
        context as unknown as Parameters<typeof decryptOAuthToken>[1],
      );
    },
    async deleteDependents(userId) {
      for (const model of dependentModels)
        await context.adapter.deleteMany({
          model,
          where: [{ field: "userId", value: userId }],
        });
    },
    async deleteUser(userId) {
      await context.internalAdapter.deleteUserSessions(userId);
      await context.internalAdapter.deleteUser(userId);
    },
  };
}

function log(event: string, detail?: string) {
  // Codes only: never a token, an email or a user identifier.
  console.warn(`[identity-deletion] ${event}`, detail ?? "");
}

const revokeApple = (tokens: Parameters<typeof revokeAppleTokens>[0]) =>
  revokeAppleTokens(tokens);

/** User-initiated path, called from Better Auth's beforeDelete hook. */
export async function purgeIdentityDependents(userId: string): Promise<void> {
  await revokeAndPurgeDependents(userId, await identityStore(), revokeApple, log);
}

/** Cloud-initiated path: never calls the Cloud back. */
export async function deleteIdentityFromCloud(
  userId: string,
): Promise<{ deleted: boolean }> {
  return deleteIdentity(userId, await identityStore(), revokeApple, log);
}
