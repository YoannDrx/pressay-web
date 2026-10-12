import type { Metadata } from "next";
import { localizedMetadata } from "@/lib/page-metadata";
import { SecurityPage } from "@/components/security-page";

export const metadata: Metadata = localizedMetadata({
  locale: "fr",
  path: "/security",
  title: "Sécurité",
  description:
    "Comment Pressay garde la dictée locale, vérifie la cible et montre chaque route de traitement.",
});
export default function Page() { return <SecurityPage locale="fr" />; }
