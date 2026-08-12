import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { betterAuthIsConfigured } from "@/lib/auth-env";

const handlers = toNextJsHandler(auth);

function unavailable(): Response {
  return Response.json({ error: "identity_provider_not_configured" }, { status: 503 });
}

export const GET = betterAuthIsConfigured() ? handlers.GET : unavailable;
export const POST = betterAuthIsConfigured() ? handlers.POST : unavailable;
