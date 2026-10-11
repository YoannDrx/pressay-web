import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/page-metadata";
import { PricingPage } from "@/components/pricing-page";

export const metadata: Metadata = localizedMetadata({
  locale: "fr",
  path: "/pricing",
  title: "Tarifs",
  description:
    "Free reste illimité en local. Pro : modes de réécriture, profils par app, BYOK, Apple Intelligence, synchronisation chiffrée et Pressay Cloud.",
});
export default function Page() { return <PricingPage locale="fr" />; }
