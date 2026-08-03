import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";

export const metadata: Metadata = { title: "Dictée contrôlable pour macOS", alternates: { canonical: "/fr", languages: { "fr-FR": "/fr", "en-US": "/en" } } };
export default function FrenchHome() { return <LandingPage locale="fr" />; }
