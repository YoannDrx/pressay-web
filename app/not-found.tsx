import type { Metadata } from "next";
import { headers } from "next/headers";
import { ContentPage } from "@/components/content-page";
import { accountLocale } from "@/lib/account-locale";
import { privateMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = {
  title: "404",
  ...privateMetadata,
};

export default async function NotFound() {
  const path = (await headers()).get("x-pressay-path") ?? "";
  const fromPath = path.match(/^\/(fr|en)(?:[/?#]|$)/)?.[1];
  const locale =
    fromPath === "fr" || fromPath === "en" ? fromPath : await accountLocale();
  const fr = locale === "fr";
  return (
    <ContentPage
      locale={locale}
      eyebrow="404"
      title={fr ? "Cette page n’existe pas." : "This page does not exist."}
      intro={
        fr
          ? "Le lien est peut-être ancien ou mal copié. Voici les pages les plus utiles."
          : "The link may be outdated or mistyped. Here are the most useful pages."
      }
    >
      <div className="legal-actions">
        <a className="button button-primary" href={`/${locale}`}>
          {fr ? "Accueil" : "Home"}
        </a>
        <a className="button" href={`/${locale}/download`}>
          {fr ? "Télécharger Pressay" : "Download Pressay"}
        </a>
        <a className="button" href={`/${locale}/support`}>
          Support
        </a>
      </div>
    </ContentPage>
  );
}
