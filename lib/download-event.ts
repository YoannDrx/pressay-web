import "server-only";
import { auth } from "@/lib/auth";
import { identityProvider } from "@/lib/auth-env";

export type DownloadEvent = {
  anonymousID: string;
  platform: "macos" | "windows";
  assetType: "dmg" | "exe" | "msi";
  appVersion: string;
  source: string;
  campaign?: string;
  referralCode?: string;
};

/** UTM values come from the visitor's URL; the Cloud only accepts plain labels. */
export function downloadLabel(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed && /^[\w.-]{1,64}$/.test(trimmed) ? trimmed : undefined;
}

/**
 * Report a download start to the Cloud with a short-lived token signed by the
 * Better Auth keys for the download-event audience only. Counting never blocks
 * or breaks the download itself.
 */
export async function reportDownload(event: DownloadEvent): Promise<void> {
  const apiURL = process.env.PRESSAY_API_URL?.replace(/\/+$/, "");
  if (!apiURL || identityProvider() !== "better-auth") return;
  const base = apiURL.endsWith("/v1") ? apiURL : `${apiURL}/v1`;
  try {
    const { token } = await auth.api.signJWT({
      body: {
        payload: {
          sub: "press-say.app",
          token_use: "pressay_download_event",
          aud: "pressay-download-event",
        },
      },
    });
    await fetch(`${base}/downloads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Counting is best effort.
  }
}
