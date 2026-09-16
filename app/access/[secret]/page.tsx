import Link from "next/link";
import { redirect } from "next/navigation";
import { AccessCodeForm } from "@/components/account-controls";
import { accountLocale } from "@/lib/account-locale";
import { getWebIdentity } from "@/lib/server-identity";
export const metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function Page({
  params,
}: {
  params: Promise<{ secret: string }>;
}) {
  const { secret } = await params;
  const locale = await accountLocale();
  const fr = locale === "fr";
  if (!(await getWebIdentity()))
    redirect(
      "/sign-in?redirect_url=" + encodeURIComponent(`/access/${secret}`),
    );
  return (
    <main className="auth-page" lang={locale}>
      <div className="auth-placeholder">
        <h1>{fr ? "Active ton accès offert" : "Activate your gift access"}</h1>
        <AccessCodeForm locale={locale} presetSecret={secret} />
        <Link href="/account">{fr ? "Mon compte" : "My account"}</Link>
      </div>
    </main>
  );
}
