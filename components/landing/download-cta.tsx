import { PlatformGlyph } from "@/components/landing/glyphs";
import { copy, systemRequirements, type LandingCopy, type Locale, type Platform } from "@/lib/content";

/**
 * Closing download choice: the visitor's own system first and primary, the
 * other one right next to it. Both link to the download page, which shows the
 * release, its checksum and the installation steps.
 */
export function DownloadCta({ locale, text, platform, windowsAvailable }: {
  locale: Locale;
  text: LandingCopy["cta"];
  platform: Platform;
  windowsAvailable: boolean;
}) {
  const detected: Platform = windowsAvailable ? platform : "macos";
  const order: Platform[] = detected === "windows" ? ["windows", "macos"] : ["macos", "windows"];
  const names: Record<Platform, string> = { macos: "macOS", windows: "Windows" };
  return (
    <section className="section cta" id="download" aria-labelledby="cta-title">
      <div className="shell cta-layout">
        <div className="cta-copy">
          <h2 id="cta-title">{text.title}</h2>
          <p>{text.body}</p>
        </div>
        <ul className="cta-platforms">
          {order.map((item) => {
            const primary = item === detected;
            const available = item === "macos" || windowsAvailable;
            return (
              <li key={item} className={primary ? "is-detected" : undefined}>
                <PlatformGlyph platform={item} />
                <h3>{names[item]}{primary ? <span className="cta-tag">{text.detected}</span> : null}</h3>
                <p>{systemRequirements[locale][item]}</p>
                {available ? (
                  <a className={`button full ${primary ? "button-primary" : "button-secondary"}`} href={`/${locale}/download#${item}`}>
                    {copy[locale].download[item]}
                  </a>
                ) : (
                  <p className="cta-soon">{text.soon}</p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
