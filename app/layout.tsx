import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://press-say.app"),
  title: { default: "Pressay — Le Voice OS local du Mac", template: "%s · Pressay" },
  description: "Dictez, transformez et corrigez dans chaque app avec une route de traitement visible et le local par défaut.",
  applicationName: "Pressay",
  alternates: { canonical: "/fr", languages: { "fr-FR": "/fr", "en-US": "/en" } },
  openGraph: { type: "website", siteName: "Pressay", title: "Pressay — Votre Mac devient vocal.", description: "Le Voice OS local qui rend chaque route de traitement visible.", url: "https://press-say.app/fr" },
  twitter: { card: "summary_large_image", title: "Pressay", description: "The local Voice OS for macOS." },
  icons: { icon: "/logo.svg" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
