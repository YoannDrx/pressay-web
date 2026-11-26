import icons from "@iconify-json/logos/icons.json" with { type: "json" };
import simpleIcons from "@iconify-json/simple-icons/icons.json" with { type: "json" };

type IconSource = "logos" | "simple";
/** [visible name, icon name, icon collection (defaults to "logos")] */
export type CompatibleApplication = readonly [string, string, IconSource?];

/**
 * Applications shown in the landing compatibility wall, grouped by what people
 * dictate into them. Names are the visible labels; the logos only indicate
 * compatibility (see BRAND_ASSETS.md).
 */
export const compatibleApplicationGroups = [
  {
    id: "write",
    applications: [
      ["Mail", "apple"], ["Outlook", "microsoftoutlook", "simple"], ["Gmail", "google-gmail"],
      ["Word", "microsoftword", "simple"], ["Notion", "notion-icon"], ["Notes", "apple"],
      ["Obsidian", "obsidian-icon"],
    ],
  },
  {
    id: "chat",
    applications: [
      ["Slack", "slack-icon"], ["Teams", "microsoft-teams"], ["WhatsApp", "whatsapp-icon"],
      ["Discord", "discord-icon"],
    ],
  },
  {
    id: "code",
    applications: [
      ["Cursor", "cursor", "simple"], ["VS Code", "visual-studio-code"], ["Xcode", "xcode"],
      ["Terminal", "terminal"], ["Windows Terminal", "windowsterminal", "simple"],
    ],
  },
  {
    id: "browse",
    applications: [
      ["ChatGPT", "openai-icon"], ["Claude", "claude-icon"], ["Chrome", "chrome"],
      ["Safari", "safari"], ["Edge", "microsoft-edge"], ["Firefox", "firefox"],
    ],
  },
] as const satisfies ReadonlyArray<{ id: string; applications: ReadonlyArray<CompatibleApplication> }>;

export type CompatibleApplicationGroupId = (typeof compatibleApplicationGroups)[number]["id"];

/** Every application of the wall, in display order. */
export function compatibleApplications(): CompatibleApplication[] {
  return compatibleApplicationGroups.flatMap((group): CompatibleApplication[] => [...group.applications]);
}

/** Public file name of an icon, e.g. `logos-slack-icon.svg`. */
export function brandIconFile(name: string, source: IconSource = "logos"): string {
  return `${source}-${name}.svg`;
}

/** Every icon file the wall references, for static generation. */
export function brandIconFiles(): string[] {
  return Array.from(new Set(compatibleApplications().map((application) =>
    brandIconFile(application[1], application[2] ?? "logos"))));
}

/**
 * Standalone SVG document for a wall icon file, or null when the file is not
 * one the wall uses. The logos are served as cacheable files instead of inline
 * data URIs, which used to add ~370 KB to every landing HTML response.
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
