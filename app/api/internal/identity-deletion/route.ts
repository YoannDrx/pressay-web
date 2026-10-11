import { NextResponse } from "next/server";
import { betterAuthIsConfigured } from "@/lib/auth-env";
import {
  cloudInternalIssuer,
  internalJWTSecret,
  verifyIdentityDeletionRequest,
} from "@/lib/internal-identity-token";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/**
 * Cloud -> web identity deletion (cross-repo contract §2). Deletes the Better
 * Auth identity without calling the Cloud DELETE /me back.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => undefined);
  const verification = await verifyIdentityDeletionRequest(
    request.headers.get("authorization"),
    body,
    { secret: internalJWTSecret(), issuer: cloudInternalIssuer() },
  );
  if (!verification.ok)
    return NextResponse.json(
      { error: verification.error },
      { status: verification.status, headers: noStore },
    );
  if (!betterAuthIsConfigured())
    return NextResponse.json(
      { error: "identity_provider_not_configured" },
      { status: 503, headers: noStore },
    );
  try {
    const { deleteIdentityFromCloud } = await import(
      "@/lib/identity-deletion-store"
    );
    const result = await deleteIdentityFromCloud(verification.request.userId);
    return NextResponse.json(result, { status: 200, headers: noStore });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code)
        : "unknown";
    console.error("[identity-deletion] failed", code);
    // Transient: the Cloud retries with its job mechanism.
    return NextResponse.json(
      { error: "identity_deletion_unavailable" },
      { status: 503, headers: noStore },
    );
  }
}
