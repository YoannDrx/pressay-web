import type { Metadata } from "next"; import { DownloadPage } from "@/components/download-page";
export const metadata: Metadata = { title: "Télécharger", alternates: { canonical: "/fr/download" } };
export default function Page() { return <DownloadPage locale="fr" />; }
