import icons from "@iconify-json/logos/icons.json";
import simpleIcons from "@iconify-json/simple-icons/icons.json";

const applications = [
  ["Mail", "apple"], ["Notes", "apple"], ["Safari", "safari"],
  ["Chrome", "chrome"], ["Slack", "slack-icon"], ["Notion", "notion-icon"],
  ["Gmail", "google-gmail"], ["Cursor", "cursor", "simple"],
  ["VS Code", "visual-studio-code"], ["Xcode", "xcode"],
  ["Terminal", "terminal"], ["Teams", "microsoft-teams"], ["Obsidian", "obsidian-icon"]
] as const satisfies ReadonlyArray<readonly [string, string, ("logos" | "simple")?]>;

type Application = typeof applications[number];

export function AppLogoMarquee({ locale }: { locale: "fr" | "en" }) {
  return <div className="app-logo-field">
    <ul className="sr-only" aria-label={locale === "fr" ? "Applications compatibles" : "Compatible applications"}>
      {applications.map(([name]) => <li key={name}>{name}</li>)}
    </ul>
    <Track applications={applications.slice(0, 7)} />
    <Track applications={applications.slice(7)} reverse />
  </div>;
}

function Track({ applications: track, reverse = false }: { applications: readonly Application[]; reverse?: boolean }) {
  return <div className={`logo-track ${reverse ? "logo-track-reverse" : ""}`} aria-hidden="true">
    <div>{[...track, ...track].map((application, index) => {
      const [name, icon, source] = application;
      return <span className="app-logo-card" key={`${name}-${index}`}>
        <BrandIcon name={icon} source={source} /><b>{name}</b>
      </span>;
    })}</div>
  </div>;
}

function BrandIcon({ name, source = "logos" }: { name: string; source?: "logos" | "simple" }) {
  if (source === "simple") {
    const icon = simpleIcons.icons[name as keyof typeof simpleIcons.icons];
    if (!icon) return <span className="brand-icon-fallback">●</span>;
    const width = "width" in icon ? icon.width : simpleIcons.width;
    const height = "height" in icon ? icon.height : simpleIcons.height;
    return <svg className="brand-icon" viewBox={`0 0 ${width} ${height}`} role="presentation" dangerouslySetInnerHTML={{ __html: icon.body }} />;
  }
  const icon = icons.icons[name as keyof typeof icons.icons];
  if (!icon) return <span className="brand-icon-fallback">●</span>;
  const width = "width" in icon ? icon.width : icons.width;
  const height = "height" in icon ? icon.height : icons.height;
  return <svg className="brand-icon" viewBox={`0 0 ${width} ${height}`} role="presentation" dangerouslySetInnerHTML={{ __html: icon.body }} />;
}
