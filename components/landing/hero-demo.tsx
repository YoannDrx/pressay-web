"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Keys, Wave } from "@/components/landing/keys";
import type { Platform } from "@/lib/content";

export type DemoScene = { platform: Platform; app: string; field: string; text: string; keys: string[] };
type Phase = "idle" | "listening" | "written";
type State = { scene: number; phase: Phase; words: number };

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(reducedMotionQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Milliseconds before the next step of the dictation loop. */
const timing = { idle: 900, perWord: 150, release: 450, written: 2800, firstHold: 1600 };

/**
 * The hero demonstration: hold the shortcut, speak, the words write
 * themselves into the field, on a Mac and then on a PC. The server renders the
 * finished first scene, so the page reads fine without scripts and with
 * reduced motion; the loop only runs while visible and can be paused.
 */
export function HeroDemo({ scenes, label, status, local, pauseLabel, playLabel }: {
  scenes: DemoScene[];
  label: string;
  status: Record<Phase, string>;
  local: string;
  pauseLabel: string;
  playLabel: string;
}) {
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia(reducedMotionQuery).matches, () => true);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [state, setState] = useState<State>({ scene: 0, phase: "written", words: Number.MAX_SAFE_INTEGER });
  const started = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const running = !reduced && !paused && visible;

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && document.visibilityState === "visible"));
    observer.observe(element);
    const onVisibility = () => setVisible(document.visibilityState === "visible" && element.getBoundingClientRect().bottom > 0);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  useEffect(() => {
    if (!running) return;
    const words = scenes[state.scene].text.split(" ").length;
    let delay: number;
    let next: (current: State) => State;
    if (state.phase === "written") {
      delay = started.current ? timing.written : timing.firstHold;
      next = (current) => ({ scene: (current.scene + 1) % scenes.length, phase: "idle", words: 0 });
    } else if (state.phase === "idle") {
      delay = timing.idle;
      next = (current) => ({ ...current, phase: "listening" });
    } else if (state.words < words) {
      delay = timing.perWord;
      next = (current) => ({ ...current, words: current.words + 1 });
    } else {
      delay = timing.release;
      next = (current) => ({ ...current, phase: "written" });
    }
    const timer = window.setTimeout(() => { started.current = true; setState(next); }, delay);
    return () => window.clearTimeout(timer);
  }, [running, state, scenes]);

  const scene = scenes[state.scene];
  const words = scene.text.split(" ");
  const shown = Math.min(state.words, words.length);
  return (
    <div className="demo" ref={root} data-phase={state.phase} data-platform={scene.platform}>
      <div className="demo-stage" role="img" aria-label={label}>
        <div className="demo-window">
          <div className="demo-titlebar">
            <span className="demo-controls"><i /><i /><i /></span>
            <strong>{scene.app}</strong>
          </div>
          <div className="demo-meta">{scene.field}</div>
          <p className="demo-text">
            {shown === 0 ? <i className="demo-caret demo-caret-start" /> : null}
            {words.map((word, index) => (
              <span key={`${state.scene}-${index}`} className={index < shown ? "on" : undefined}>
                {word}{index === shown - 1 ? <i className="demo-caret" /> : null}{" "}
              </span>
            ))}
          </p>
        </div>
        <div className="voice-bar">
          <Keys keys={scene.keys} className="voice-keys" />
          <Wave count={22} className="voice-wave" />
          <span className="voice-status">
            {state.phase === "written" ? (
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>
            ) : null}
            {state.phase === "written" ? `${status.written} · ${scene.app}` : status[state.phase]}
          </span>
          <span className="voice-route">{local}</span>
        </div>
      </div>
      {reduced ? null : (
        <button type="button" className="demo-toggle" onClick={() => setPaused((value) => !value)}>
          {paused ? (
            <svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M5 3.5v9l7-4.5z" /></svg>
          ) : (
            <svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M4.5 3.5h2.5v9H4.5zM9 3.5h2.5v9H9z" /></svg>
          )}
          {paused ? playLabel : pauseLabel}
        </button>
      )}
    </div>
  );
}
