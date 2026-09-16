import { notFound } from "next/navigation";
import { AccountSection } from "@/components/account-section";
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!["devices", "referrals", "security"].includes(section)) notFound();
  return <AccountSection section={section} />;
}
