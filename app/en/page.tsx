import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";

export const metadata: Metadata = { title: "Controlled dictation for macOS", alternates: { canonical: "/en", languages: { "fr-FR": "/fr", "en-US": "/en" } } };
export default function EnglishHome() { return <LandingPage locale="en" />; }
