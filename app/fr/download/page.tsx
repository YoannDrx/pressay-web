import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/page-metadata";
import { DownloadPage } from "@/components/download-page";

export const metadata: Metadata = localizedMetadata({
  locale: "fr",
  path: "/download",
  title: "Télécharger",
  description:
    "Pressay pour macOS 14+ sur Apple Silicon, signé Developer ID et notarialisé par Apple.",
});
export default function Page() { return <DownloadPage locale="fr" />; }
