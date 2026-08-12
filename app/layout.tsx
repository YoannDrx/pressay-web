import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { identityProvider } from "@/lib/auth-env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://press-say.app"),
  title: { default: "Pressay — Dictée contrôlable pour macOS", template: "%s · Pressay" },
  description: "Votre voix, partout où vous écrivez. Dictée locale ou BYOK, cible vérifiée et presse-papiers préservé sur macOS.",
  applicationName: "Pressay",
  alternates: { canonical: "/fr", languages: { "fr-FR": "/fr", "en-US": "/en" } },
  openGraph: { type: "website", siteName: "Pressay", title: "Pressay — Votre voix, partout où vous écrivez.", description: "La dictée macOS qui rend la cible, le contexte et la réversibilité visibles.", url: "https://press-say.app/fr" },
  twitter: { card: "summary_large_image", title: "Pressay", description: "Controlled voice dictation for macOS." },
  icons: { icon: "/logo.svg" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const body = <html lang="fr" data-scroll-behavior="smooth"><body>{children}</body></html>;
  return identityProvider() === "clerk"
    ? <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>{body}</ClerkProvider>
    : body;
}
