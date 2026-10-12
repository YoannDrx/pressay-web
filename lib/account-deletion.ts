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
