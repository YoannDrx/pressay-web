import { getWebIdentity } from "@/lib/server-identity";
import { pressayAPI } from "@/lib/pressay-api";
export const dynamic = "force-dynamic";
export async function GET() {
  const headers = {
    "Cache-Control": "private, no-store, max-age=0",
    Vary: "Cookie",
  };
  try {
    const identity = await getWebIdentity();
    if (!identity)
      return Response.json({ authenticated: false, admin: false }, { headers });
    const admin = await pressayAPI("admin/session").catch(() => null);
    return Response.json(
      {
        authenticated: true,
        admin: admin?.ok === true,
        sessionKey: identity.sessionID ?? identity.subject,
      },
      { headers },
    );
  } catch {
    return Response.json(
      { error: "session_unavailable" },
      { status: 503, headers },
    );
  }
}
