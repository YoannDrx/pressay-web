import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/page-metadata";
import { SecurityPage } from "@/components/security-page";

export const metadata: Metadata = localizedMetadata({
  locale: "en",
  path: "/security",
  title: "Security",
  description:
    "How Pressay keeps dictation local, verifies the target and shows every processing route.",
});
export default function Page() { return <SecurityPage locale="en" />; }
