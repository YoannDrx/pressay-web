import type { Metadata } from "next";
import { SecureInputHelp } from "@/components/secure-input-help";

export const metadata: Metadata = {
  title: "Secure Input",
  alternates: {
    canonical: "/fr/support/secure-input",
    languages: {
      fr: "/fr/support/secure-input",
      en: "/en/support/secure-input",
    },
  },
};

export default function Page() {
  return <SecureInputHelp locale="fr" />;
}
