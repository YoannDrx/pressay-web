import { ContentPage } from "@/components/content-page";
import Link from "next/link";
import type { Locale } from "@/lib/content";
import { getPublicRelease } from "@/lib/release";

export async function DownloadPage({ locale }: { locale: Locale }) {
  const fr = locale === "fr";
  const release = await getPublicRelease();
  return <ContentPage locale={locale} eyebrow="DOWNLOAD / DIRECT" title={fr ? "Pressay pour macOS." : "Pressay for macOS."} intro={fr ? "Édition Direct universelle, signée Developer ID et notarialisée par Apple." : "Universal Direct edition, Developer ID signed and notarized by Apple."}>
    <section className="download-card"><div><span className="mono-label">PUBLIC STABLE</span><h2>{release.tag}</h2><p>macOS 14+ · arm64 + x86_64</p></div><div className="download-actions"><Link className="button button-primary" href="/download/pressay">{fr ? "Télécharger Pressay.dmg" : "Download Pressay.dmg"}</Link><a className="inline-arrow" href={release.checksumURL}>{fr ? "Vérifier le SHA-256" : "Verify SHA-256"} →</a></div></section>
    <section className="steps"><h2>{fr ? "Installation" : "Installation"}</h2><ol>{(fr ? ["Ouvre le DMG et glisse Pressay dans Applications.", "Lance Pressay et choisis Fast, Polyglot ou Precise pour transcrire en local.", "Accorde Microphone, puis Accessibilité au premier usage de l’insertion.", "Maintiens ton raccourci, parle, puis relâche."] : ["Open the DMG and drag Pressay to Applications.", "Launch Pressay and choose Fast, Polyglot or Precise for local transcription.", "Grant Microphone, then Accessibility the first time insertion needs it.", "Hold your shortcut, speak, then release."]).map((step) => <li key={step}>{step}</li>)}</ol></section>
  </ContentPage>;
}
