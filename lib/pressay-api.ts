import "server-only";
import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";

export function commercialIsConfigured(): boolean {
  return Boolean(
    process.env.PRESSAY_API_URL &&
    process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  );
}

export function commercialCheckoutIsEnabled(): boolean {
  return commercialIsConfigured()
    && process.env.COMMERCIAL_CHECKOUT_ENABLED === "true";
}

export async function pressayAPI(
  path: string,
  init: RequestInit = {},
  options: { bootstrap?: boolean } = {}
): Promise<Response> {
  if (!commercialIsConfigured()) {
    return Response.json({ error: "commercial_beta_not_configured" }, { status: 503 });
  }
  const { userId, getToken } = await auth();
  if (!userId) return Response.json({ error: "authentication_required" }, { status: 401 });
  const token = await getToken({ template: "pressay-api" });
  if (!token) return Response.json({ error: "api_token_unavailable" }, { status: 401 });
  const base = normalizedAPIURL();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("X-Request-ID", randomUUID());
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (options.bootstrap) {
    const bootstrap = await fetch(`${base}/accounts/bootstrap`, {
      method: "POST", headers, cache: "no-store"
    });
    if (!bootstrap.ok && bootstrap.status !== 409) return bootstrap;
  }
  return fetch(`${base}/${path.replace(/^\/+/, "")}`, {
    ...init,
    headers,
    cache: "no-store"
  });
}

export async function pressayJSON<T>(path: string): Promise<{ response: Response; data: T | null }> {
  const response = await pressayAPI(path);
  const parsed = await response.json().catch(() => null) as T | null;
  return { response, data: response.ok ? parsed : null };
}

function normalizedAPIURL(): string {
  const configured = process.env.PRESSAY_API_URL!.replace(/\/+$/, "");
  return configured.endsWith("/v1") ? configured : `${configured}/v1`;
}
