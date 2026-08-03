import type { Metadata } from "next"; import { PricingPage } from "@/components/pricing-page";
export const metadata: Metadata = { title: "Tarifs", alternates: { canonical: "/fr/pricing" } };
export default function Page() { return <PricingPage locale="fr" />; }
