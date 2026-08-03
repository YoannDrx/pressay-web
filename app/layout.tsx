import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://press-say.app"),
  title: { default: "Pressay — Dictée contrôlable pour macOS", template: "%s · Pressay" },
  description: "Maintiens Fn, parle, c’est écrit. Dictée locale ou BYOK, cible vérifiée et presse-papiers préservé sur macOS.",
  applicationName: "Pressay",
  alternates: { canonical: "/fr", languages: { "fr-FR": "/fr", "en-US": "/en" } },
  openGraph: { type: "website", siteName: "Pressay", title: "Pressay — Maintiens Fn. Parle. C’est écrit.", description: "La dictée macOS qui rend la cible, le contexte et la réversibilité visibles.", url: "https://press-say.app/fr" },
  twitter: { card: "summary_large_image", title: "Pressay", description: "Controlled voice dictation for macOS." },
  icons: { icon: "/logo.svg" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const body = <html lang="fr"><body>{children}</body></html>;
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ? <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>{body}</ClerkProvider>
    : body;
}
