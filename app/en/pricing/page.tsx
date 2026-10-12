import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/page-metadata";
import { PricingPage } from "@/components/pricing-page";

export const metadata: Metadata = localizedMetadata({
  locale: "en",
  path: "/pricing",
  title: "Pricing",
  description:
    "Free stays unlimited locally. Pro: rewrite modes, per-app profiles, BYOK, Apple Intelligence, encrypted sync and Pressay Cloud.",
});
export default function Page() { return <PricingPage locale="en" />; }
