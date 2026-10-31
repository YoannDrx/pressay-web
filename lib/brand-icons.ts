import icons from "@iconify-json/logos/icons.json" with { type: "json" };
import simpleIcons from "@iconify-json/simple-icons/icons.json" with { type: "json" };

/** Application logos shown in the landing compatibility marquee. */
export const marqueeApplications = [
  ["Mail", "apple"], ["Notes", "apple"], ["Safari", "safari"],
  ["Chrome", "chrome"], ["Slack", "slack-icon"], ["Notion", "notion-icon"],
  ["Gmail", "google-gmail"], ["Cursor", "cursor", "simple"],
  ["VS Code", "visual-studio-code"], ["Xcode", "xcode"],
  ["Terminal", "terminal"], ["Teams", "microsoft-teams"], ["Obsidian", "obsidian-icon"]
] as const satisfies ReadonlyArray<readonly [string, string, ("logos" | "simple")?]>;

export type MarqueeApplication = typeof marqueeApplications[number];

/** Public file name of an icon, e.g. `logos-slack-icon.svg`. */
export function brandIconFile(name: string, source: "logos" | "simple" = "logos"): string {
  return `${source}-${name}.svg`;
}

/** Every icon file the marquee references, for static generation. */
export function brandIconFiles(): string[] {
  return Array.from(new Set(marqueeApplications.map((application) =>
    brandIconFile(application[1], application[2] ?? "logos"))));
}

/**
 * Standalone SVG document for a marquee icon file, or null when the file is
 * not one the marquee uses. The logos are served as cacheable files instead of
 * inline data URIs, which used to add ~370 KB to every landing HTML response.
 */
export function brandIconSVG(file: string): string | null {
  if (!brandIconFiles().includes(file)) return null;
  const match = file.match(/^(logos|simple)-(.+)\.svg$/);
  if (!match) return null;
  const [, source, name] = match;
  const set = source === "simple" ? simpleIcons : icons;
  const icon = (set.icons as Record<string, { body: string; width?: number; height?: number }>)[name];
  if (!icon) return null;
  const width = typeof icon.width === "number" ? icon.width : set.width;
  const height = typeof icon.height === "number" ? icon.height : set.height;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${icon.body}</svg>`;
}
