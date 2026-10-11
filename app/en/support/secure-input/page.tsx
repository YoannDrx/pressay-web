import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/page-metadata";
import { SecureInputHelp } from "@/components/secure-input-help";

export const metadata: Metadata = localizedMetadata({
  locale: "en",
  path: "/support/secure-input",
  title: "Secure Input",
  description:
    "Why macOS blocks dictation in secure fields and how to release Secure Input.",
});
export default function Page() {
  return <SecureInputHelp locale="en" />;
}
