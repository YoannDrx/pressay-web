import { PlatformGlyph } from "@/components/landing/glyphs";
import { brandIconFile, compatibleApplicationGroups } from "@/lib/brand-icons";
import { systemRequirements, type LandingCopy, type Locale } from "@/lib/content";

export function Apps({ locale, text, windowsAvailable }: { locale: Locale; text: LandingCopy["apps"]; windowsAvailable: boolean }) {
  return (
    <section className="section apps" id="apps" aria-labelledby="apps-title">
      <div className="shell">
        <div className="section-head">
          <h2 id="apps-title">{text.title}</h2>
          <p>{text.body}</p>
        </div>
        <ul className="apps-platforms">
          <li><PlatformGlyph platform="macos" /><span><strong>macOS</strong>{systemRequirements[locale].macos}</span></li>
          {windowsAvailable ? <li><PlatformGlyph platform="windows" /><span><strong>Windows</strong>{systemRequirements[locale].windows}</span></li> : null}
        </ul>
        <div className="apps-wall" role="list" aria-label={text.listLabel}>
          {compatibleApplicationGroups.map((group) => (
            <div className="apps-group" role="listitem" key={group.id}>
              <h3>{text.groups[group.id]}</h3>
              <ul>
                {group.applications.map((application) => {
                  const [name, icon] = application;
                  const source = application.length > 2 ? application[2] : "logos";
                  return (
                    <li className="app-logo" key={name}>
                      {/* Cacheable files from /brand-icons; the visible name is the label. */}
                      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, nothing to optimize */}
                      <img className="brand-icon" src={`/brand-icons/${brandIconFile(icon, source)}`} alt="" width={24} height={24} loading="lazy" decoding="async" />
                      <span>{name}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
