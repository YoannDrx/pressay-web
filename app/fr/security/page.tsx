import type { Metadata } from "next"; import { SecurityPage } from "@/components/security-page";
export const metadata: Metadata = { title: "Sécurité", alternates: { canonical: "/fr/security" } };
export default function Page() { return <SecurityPage locale="fr" />; }
