"use client";
import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";

type Platform = "macos" | "windows";
const platforms: Platform[] = ["macos", "windows"];

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/** A #macos or #windows link wins; otherwise the visitor's own system. */
function detectedPlatform(): Platform {
  if (window.location.hash === "#windows") return "windows";
  if (window.location.hash === "#macos") return "macos";
  const hints = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  const windows = hints?.platform ? hints.platform === "Windows" : navigator.userAgent.includes("Windows");
  return windows ? "windows" : "macos";
}

/**
 * Both panels are server-rendered; this only picks which one is shown. It
 * never starts a download by itself.
 */
export function DownloadPlatformTabs({ label, tabs, panels }: { label: string; tabs: Record<Platform, string>; panels: Record<Platform, ReactNode> }) {
  const detected = useSyncExternalStore(subscribe, detectedPlatform, () => "macos" as Platform);
  const [chosen, setChosen] = useState<Platform | null>(null);
  const selected = chosen ?? detected;
  const tabRefs = useRef<Record<Platform, HTMLButtonElement | null>>({ macos: null, windows: null });
  const scrolled = useRef(false);
  useEffect(() => {
    // The browser cannot scroll to #windows while its panel is still hidden.
    if (scrolled.current || selected !== "windows" || window.location.hash !== "#windows") return;
    scrolled.current = true;
    document.getElementById("windows")?.scrollIntoView();
  }, [selected]);
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = platforms.indexOf(selected);
    const next =
      event.key === "ArrowRight" ? platforms[(index + 1) % platforms.length] :
      event.key === "ArrowLeft" ? platforms[(index + platforms.length - 1) % platforms.length] :
      event.key === "Home" ? platforms[0] :
      event.key === "End" ? platforms[platforms.length - 1] : null;
    if (!next) return;
    event.preventDefault();
    setChosen(next);
    tabRefs.current[next]?.focus();
  };
  return <div className="download-platforms">
    <div className="download-tabs" role="tablist" aria-label={label}>{platforms.map((platform) =>
      <button key={platform} ref={(element) => { tabRefs.current[platform] = element; }} type="button" role="tab" id={`download-tab-${platform}`} aria-controls={platform} aria-selected={selected === platform} tabIndex={selected === platform ? 0 : -1} onClick={() => setChosen(platform)} onKeyDown={onKeyDown}>{tabs[platform]}</button>
    )}</div>
    {platforms.map((platform) =>
      <section key={platform} id={platform} role="tabpanel" aria-labelledby={`download-tab-${platform}`} hidden={selected !== platform} tabIndex={0}>{panels[platform]}</section>
    )}
  </div>;
}
