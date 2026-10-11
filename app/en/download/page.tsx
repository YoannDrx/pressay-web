import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/page-metadata";
import { DownloadPage } from "@/components/download-page";

export const metadata: Metadata = localizedMetadata({
  locale: "en",
  path: "/download",
  title: "Download",
  description:
    "Pressay for macOS 14+ on Apple Silicon, Developer ID signed and notarized by Apple.",
});
export default function Page() { return <DownloadPage locale="en" />; }
