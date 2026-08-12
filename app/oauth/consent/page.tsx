import Image from "next/image";
import Link from "next/link";
import { OAuthConsent } from "@/components/oauth-consent";

export default async function ConsentPage({
  searchParams
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const requested = (await searchParams).scope?.split(" ").filter(Boolean) ?? [];
  const allowed = ["openid", "profile", "email", "offline_access"];
  const scopes = requested.filter((scope) => allowed.includes(scope));
  return <main className="auth-page">
    <Link className="brand auth-brand" href="/fr"><Image src="/logo.svg" width="34" height="34" alt="" />pressay</Link>
    <OAuthConsent scopes={scopes.length ? scopes : allowed} />
  </main>;
}
