import simpleIcons from "@iconify-json/simple-icons/icons.json" with { type: "json" };
import type { Platform } from "@/lib/content";

const platformGlyph: Record<Platform, string> = {
  macos: (simpleIcons.icons as Record<string, { body: string }>).apple.body,
  windows: (simpleIcons.icons as Record<string, { body: string }>).windows.body,
};

/** Apple or Windows mark, inherited colour, decorative. */
export function PlatformGlyph({ platform }: { platform: Platform }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: platformGlyph[platform] }} />;
}

export function ArrowGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export function CheckGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}
