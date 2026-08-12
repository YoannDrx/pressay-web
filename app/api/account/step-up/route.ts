import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { identityProvider } from "@/lib/auth-env";
import { setStepUpCookie } from "@/lib/step-up";

export async function POST(request: Request): Promise<Response> {
  if (identityProvider() !== "better-auth") {
    return NextResponse.json({ error: "step_up_not_available" }, { status: 409 });
  }
  const requestHeaders = await headers();
  const current = await auth.api.getSession({ headers: requestHeaders });
  if (!current) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  const body = await request.json().catch(() => null) as { code?: string; method?: string } | null;
  const code = body?.code?.replace(/[\s-]/g, "");
  const method = body?.method === "backup_code" ? "backup_code" : "totp";
  if (!code || code.length < 6 || code.length > 32) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }
  try {
    if (method === "backup_code") {
      await auth.api.verifyBackupCode({
        headers: requestHeaders,
        body: { code, disableSession: false, trustDevice: false }
      });
    } else {
      await auth.api.verifyTOTP({
        headers: requestHeaders,
        body: { code, trustDevice: false }
      });
    }
    const response = NextResponse.json({ verified: true, expiresIn: 10 * 60 });
    setStepUpCookie(response, current.user.id, current.session.id, method);
    return response;
  } catch {
    return NextResponse.json({ error: "invalid_or_locked_code" }, { status: 401 });
  }
}
