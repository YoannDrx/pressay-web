import type { Metadata } from "next"; import { DownloadPage } from "@/components/download-page";
export const metadata: Metadata = { title: "Download", alternates: { canonical: "/en/download" } };
export default function Page() { return <DownloadPage locale="en" />; }
