import type { Metadata } from "next"; import { PricingPage } from "@/components/pricing-page";
export const metadata: Metadata = { title: "Pricing", alternates: { canonical: "/en/pricing" } };
export default function Page() { return <PricingPage locale="en" />; }
