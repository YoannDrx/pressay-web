import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/page-metadata";
import { SecureInputHelp } from "@/components/secure-input-help";

export const metadata: Metadata = localizedMetadata({
  locale: "fr",
  path: "/support/secure-input",
  title: "Secure Input",
  description:
    "Pourquoi macOS bloque la dictée dans les champs sécurisés et comment débloquer Secure Input.",
});
export default function Page() {
  return <SecureInputHelp locale="fr" />;
}
