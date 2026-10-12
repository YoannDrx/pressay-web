import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { OAuthConsent } from "@/components/oauth-consent";
import { accountLocale } from "@/lib/account-locale";
import { privateMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = { title: "Pressay", ...privateMetadata };

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; locale?: string }>;
}) {
  const params = await searchParams;
  const locale =
    params.locale === "fr" || params.locale === "en"
      ? params.locale
      : await accountLocale();
  const requested = params.scope?.split(" ").filter(Boolean) ?? [];
  const allowed = ["openid", "profile", "email", "offline_access"];
  const scopes = requested.filter((scope) => allowed.includes(scope));
  return (
    <main className="auth-page">
      <Link className="brand auth-brand" href={`/${locale}`}>
        <Image src="/logo.svg" width="34" height="34" alt="" />
        pressay
      </Link>
      <OAuthConsent scopes={scopes.length ? scopes : allowed} locale={locale} />
    </main>
  );
}
