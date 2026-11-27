import { HeroDemo } from "@/components/landing/hero-demo";
import { PlatformGlyph } from "@/components/landing/glyphs";
import { copy, shortcuts, type LandingCopy, type Locale, type Platform } from "@/lib/content";

export function Hero({ locale, text, platform, windowsAvailable }: {
  locale: Locale;
  text: LandingCopy["hero"];
  platform: Platform;
  windowsAvailable: boolean;
}) {
  const fr = locale === "fr";
  // Never offer a Windows download before a release ships its installers.
  const primary: Platform = windowsAvailable ? platform : "macos";
  const other: Platform = primary === "macos" ? "windows" : "macos";
  const scenes = text.scenes.filter((scene) => windowsAvailable || scene.platform === "macos").map((scene) => ({
    ...scene,
    platform: scene.platform as Platform,
    keys: shortcuts[locale][scene.platform as Platform].dictate,
  }));
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-inner shell">
        <h1 id="hero-title">{text.title.join(" ")}</h1>
        <div className="hero-copy">
          <p className="hero-lede">{text.lede}</p>
          <div className="hero-actions">
            <a className="button button-primary button-large" href={`/${locale}/download#${primary}`}>
              <PlatformGlyph platform={primary} />
              {copy[locale].download[primary]}
            </a>
            {windowsAvailable ? (
              <a className="hero-other" href={`/${locale}/download#${other}`}>
                <PlatformGlyph platform={other} />
                {text.also[primary]}
              </a>
            ) : (
              <span className="hero-other">{text.windowsSoon}</span>
            )}
          </div>
          <p className="hero-free">{text.free}</p>
        </div>
        <HeroDemo
          scenes={scenes}
          label={text.demoLabel}
          status={text.status}
          local={text.local}
          pauseLabel={fr ? "Mettre en pause" : "Pause"}
          playLabel={fr ? "Reprendre" : "Play"}
        />
      </div>
    </section>
  );
}
