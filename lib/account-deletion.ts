/** Contract §3: Cloud DELETE /me answers 409 unless this flag is passed. */
export const APPLE_SUBSCRIPTIONS_URL =
  "https://apps.apple.com/account/subscriptions";
export const ACKNOWLEDGE_APPLE_SUBSCRIPTION = "acknowledgeAppleSubscription";

export function appleDeletionAcknowledged(request?: Request | null): boolean {
  if (!request) return false;
  try {
    return (
      new URL(request.url).searchParams.get(ACKNOWLEDGE_APPLE_SUBSCRIPTION) ===
      "true"
    );
  } catch {
    return false;
  }
}

/** Cloud refusal when the session did not sign in recently enough. */
export const RECENT_AUTHENTICATION_REQUIRED = "recent_authentication_required";

/**
 * Session sign-in time in seconds, sent to the Cloud as freshness proof.
 * Better Auth keeps `createdAt` when it extends a session, so this is the
 * time of the last real sign-in.
 */
export function sessionSignedInAt(createdAt: unknown): number | undefined {
  if (!(createdAt instanceof Date) && typeof createdAt !== "string")
    return undefined;
  const milliseconds = new Date(createdAt).getTime();
  return Number.isFinite(milliseconds) && milliseconds > 0
    ? Math.floor(milliseconds / 1000)
    : undefined;
}

/** Stable error code from a Cloud error envelope (modern or legacy shape). */
export function cloudErrorCode(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const error = (payload as { error?: unknown }).error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}
