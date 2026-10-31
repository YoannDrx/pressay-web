import "server-only";
import { auth } from "@/lib/auth";
import { identityProvider } from "@/lib/auth-env";
import { getWebIdentity } from "@/lib/server-identity";

const STEP_UP_SECONDS = 10 * 60;

/**
 * Whether each administrator's web account has an Authenticator app, by
 * identity subject. Call it only with subjects from a member list the Cloud
 * has just returned (owner role and step-up proven, read audited); the step-up
 * is checked again here. Reads one flag per user, nothing else.
 */
export async function memberAuthenticators(
  subjects: readonly string[],
): Promise<Map<string, boolean>> {
  const result = new Map<string, boolean>();
  if (identityProvider() !== "better-auth" || !subjects.length) return result;
  const viewer = await getWebIdentity();
  const now = Math.floor(Date.now() / 1000);
  if (
    !viewer?.stepUpAt ||
    viewer.stepUpAt > now + 60 ||
    now - viewer.stepUpAt > STEP_UP_SECONDS
  )
    return result;
  try {
    const context = await auth.$context;
    await Promise.all(
      subjects.slice(0, 100).map(async (subject) => {
        const user = (await context.internalAdapter.findUserById(subject)) as {
          twoFactorEnabled?: boolean | null;
        } | null;
        if (user) result.set(subject, user.twoFactorEnabled === true);
      }),
    );
  } catch {
    console.error("[admin-members] read_failed");
  }
  return result;
}
