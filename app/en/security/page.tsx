import type { Metadata } from "next"; import { SecurityPage } from "@/components/security-page";
export const metadata: Metadata = { title: "Security", alternates: { canonical: "/en/security" } };
export default function Page() { return <SecurityPage locale="en" />; }
