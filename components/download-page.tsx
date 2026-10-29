import { ContentPage } from "@/components/content-page";
import { DownloadPlatformTabs } from "@/components/download-platform-tabs";
import type { Locale } from "@/lib/content";
import { getPublicRelease, getWindowsRelease, type WindowsRelease } from "@/lib/release";

export async function DownloadPage({ locale }: { locale: Locale }) {
  const fr = locale === "fr";
  const [release, windows] = await Promise.all([getPublicRelease(), getWindowsRelease()]);
  const macos = <>
    <div className="download-card"><div><span className="mono-label">{release.prerelease ? "PUBLIC BETA" : "PUBLIC STABLE"}</span><h2>{release.tag}</h2><p>macOS 14+ · Apple Silicon · arm64</p>{release.prerelease ? <p className="download-beta-note">{fr ? "Version bêta : aucune version stable n’est encore publiée. Elle peut contenir des défauts ; tes données restent locales." : "Beta release: no stable version is published yet. It may contain defects; your data stays local."}</p> : null}</div><div className="download-actions">
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a route handler that counts then redirects to the DMG: next/link would prefetch it and fetch it as RSC */}
      <a className="button button-primary" href="/download/pressay">{fr ? "Télécharger Pressay.dmg" : "Download Pressay.dmg"}</a><a className="inline-arrow" href={release.checksumURL}>{fr ? "Vérifier le SHA-256" : "Verify SHA-256"} →</a></div></div>
    <div className="steps"><h2>{fr ? "Installation" : "Installation"}</h2><ol>{(fr ? ["Ouvre le DMG et glisse Pressay dans Applications.", "Lance Pressay et choisis Fast, Polyglot ou Precise pour transcrire en local.", "Accorde Microphone, puis Accessibilité au premier usage de l’insertion.", "Maintiens ton raccourci, parle, puis relâche."] : ["Open the DMG and drag Pressay to Applications.", "Launch Pressay and choose Fast, Polyglot or Precise for local transcription.", "Grant Microphone, then Accessibility the first time insertion needs it.", "Hold your shortcut, speak, then release."]).map((step) => <li key={step}>{step}</li>)}</ol></div>
  </>;
  return <ContentPage locale={locale} eyebrow="DOWNLOAD / DIRECT" title={windows ? (fr ? "Pressay pour macOS et Windows." : "Pressay for macOS and Windows.") : (fr ? "Pressay pour macOS." : "Pressay for macOS.")} intro={windows ? (fr ? "Édition Direct pour Mac Apple Silicon, signée Developer ID et notarialisée par Apple, et pour PC Windows." : "Direct edition for Apple Silicon Macs, Developer ID signed and notarized by Apple, and for Windows PCs.") : (fr ? "Édition Direct Apple Silicon, signée Developer ID et notarialisée par Apple." : "Apple Silicon Direct edition, Developer ID signed and notarized by Apple.")}>
    <DownloadPlatformTabs label={fr ? "Système" : "System"} tabs={{ macos: "macOS", windows: "Windows" }} panels={{ macos, windows: <WindowsDownload fr={fr} release={windows} /> }} />
  </ContentPage>;
}

function WindowsDownload({ fr, release }: { fr: boolean; release: WindowsRelease | null }) {
  // Nothing that looks like a download until a release ships both installers.
  if (!release) return <div className="download-card"><div><span className="mono-label">WINDOWS</span><p className="download-soon">{fr ? "Pressay pour Windows arrive bientôt." : "Pressay for Windows is coming soon."}</p></div></div>;
  return <>
    <div className="download-card"><div><span className="mono-label">{release.prerelease ? "PUBLIC BETA" : "PUBLIC STABLE"}</span><h2>{release.tag}</h2><p>{fr ? "Windows 10 22H2 ou Windows 11 · x64 ou ARM64" : "Windows 10 22H2 or Windows 11 · x64 or ARM64"}</p>{release.prerelease ? <p className="download-beta-note">{fr ? "Version bêta : elle peut contenir des défauts ; tes données restent locales." : "Beta release: it may contain defects; your data stays local."}</p> : null}</div><div className="download-actions">
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a route handler that counts then redirects to the installer: next/link would prefetch it and fetch it as RSC */}
      <a className="button button-primary" href="/download/windows?arch=x64">{fr ? "Télécharger pour Windows (x64)" : "Download for Windows (x64)"}</a>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- same counting route, ARM64 installer */}
      <a className="inline-arrow" href="/download/windows?arch=arm64">{fr ? "PC ARM (Snapdragon)" : "ARM PC (Snapdragon)"} →</a>
      <p className="download-checksums">{fr ? "Vérifier le SHA-256 :" : "Verify SHA-256:"} <a href={release.x64.checksumURL}>x64</a> · <a href={release.arm64.checksumURL}>ARM64</a></p></div></div>
    <div className="steps"><h2>{fr ? "Installation" : "Installation"}</h2><ol>{(fr ? ["Ouvre le fichier téléchargé.", "Si Windows affiche « Windows a protégé votre ordinateur », clique sur « Informations complémentaires », puis « Exécuter quand même ».", "Autorise l’accès au micro.", "Choisis ton raccourci : par défaut, maintiens Ctrl+Win, parle, puis relâche."] : ["Open the downloaded file.", "If Windows shows “Windows protected your PC”, click “More info”, then “Run anyway”.", "Allow microphone access.", "Choose your shortcut: by default, hold Ctrl+Win, speak, then release."]).map((step) => <li key={step}>{step}</li>)}</ol></div>
  </>;
}
