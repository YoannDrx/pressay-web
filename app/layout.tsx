import type { Metadata } from "next";
import { headers } from "next/headers";
import { accountLocale } from "@/lib/account-locale";
import "./globals.css";

// Pages set their own canonical URL, alternates and OpenGraph tags through
// localizedMetadata(). The root only provides neutral defaults so a page
// without metadata never claims to be the home page.
export const metadata: Metadata = {
  metadataBase: new URL("https://press-say.app"),
  title: {
    default: "Pressay — Le Voice OS local du Mac",
    template: "%s · Pressay",
  },
  description:
    "Dictez, transformez et corrigez dans chaque app avec une route de traitement visible et le local par défaut.",
  applicationName: "Pressay",
  twitter: { card: "summary_large_image" },
  icons: { icon: "/logo.svg" },
};

async function documentLanguage(): Promise<"fr" | "en"> {
  // proxy.ts forwards the requested path. Reading request headers also makes
  // every page render per request, which the CSP script nonce requires.
  const path = (await headers()).get("x-pressay-path") ?? "";
  const fromPath = path.match(/^\/(fr|en)(?:[/?#]|$)/)?.[1];
  if (fromPath === "fr" || fromPath === "en") return fromPath;
  const query = new URLSearchParams(path.split("?")[1] ?? "").get("locale");
  if (query === "fr" || query === "en") return query;
  return accountLocale();
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={await documentLanguage()} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
