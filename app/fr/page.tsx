import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { localizedMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = localizedMetadata({ locale: "fr", path: "" });
export default function Home() { return <LandingPage locale="fr" />; }
