import "server-only";
import { cache } from "react";
import { pressayAPI } from "./pressay-api";
export type Resource<T> = {
  data: T | null;
  status: number;
  requestId?: string;
  code?: string;
};
const prepare = cache(async () => {
  try {
    return await pressayAPI("accounts/web-bootstrap", { method: "POST" });
  } catch {
    return null;
  }
});
export async function accountResource<T>(path: string): Promise<Resource<T>> {
  try {
    const boot = await prepare();
    if (!boot?.ok && boot?.status !== 409)
      return {
        data: null,
        status: boot?.status ?? 503,
        requestId: boot?.headers.get("x-request-id") ?? undefined,
      };
    const response = await pressayAPI(path);
    const payload = await response.json().catch(() => null);
    return {
      data: response.ok ? payload : null,
      status: response.status,
      requestId:
        payload?.requestId ?? response.headers.get("x-request-id") ?? undefined,
      code: payload?.error?.code,
    };
  } catch {
    return { data: null, status: 503 };
  }
}
export type AccountMe = {
  email: string;
  entitlement: {
    tier: "free" | "pro";
    source: string;
    validUntil: string | null;
    offlineGraceUntil: string | null;
  };
};
export type Usage = {
  transcription: { usedSeconds: number; limitSeconds: number };
  transformations: { used: number; limit: number };
};
export type Billing = {
  provider: "stripe" | "app_store" | null;
  status: string | null;
  currentPeriodEndsAt: string | null;
  cancelAtPeriodEnd?: boolean;
};
export type Devices = {
  limit: number;
  devices: {
    id: string;
    displayName: string;
    appVersion: string;
    appVariant: string;
    lastSeenAt: string;
  }[];
};
export type { ReferralSummary as Referrals } from "./operations-contract";
