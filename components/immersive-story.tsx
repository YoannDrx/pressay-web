"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { Locale } from "@/lib/content";

const bars = [18, 34, 58, 39, 77, 53, 87, 45, 68, 31, 74, 92, 61, 38, 70, 48, 82, 56, 28, 64, 43, 76, 51];

export function ImmersiveStory({ locale }: { locale: Locale }) {
  const rootRef = useRef<HTMLElement>(null);
  const fr = locale === "fr";

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const travel = Math.max(1, root.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      const scene = Math.min(3, Math.floor(progress * 4));
      root.style.setProperty("--story-progress", progress.toFixed(4));
      root.dataset.scene = String(scene);
    };

    const schedule = () => {
      if (!frame && !reduceMotion.matches) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const chapters = fr ? [
    ["01 / PRESS", "Le signal s’ouvre.", "Maintiens ton raccourci. L’icône menu bar et la Voice Bar passent ensemble de repos à écoute."],
    ["02 / SPEAK", "Parle sans changer d’app.", "La waveform confirme que le micro écoute. L’application cible et la route Local restent visibles."],
    ["03 / TRANSFORM", "Donne la bonne forme.", "Liste, email, message, correction ou mode temporaire : les commandes de texte sont explicites et réversibles."],
    ["04 / ACT", "Le texte arrive. Pas de surprise.", "Pressay vérifie la cible, insère, confirme puis revient au repos. Toute route externe reste opt-in."],
  ] : [
    ["01 / PRESS", "The signal opens.", "Hold your shortcut. The menu bar icon and Voice Bar move together from idle to listening."],
    ["02 / SPEAK", "Talk without switching apps.", "The waveform confirms capture. The target app and Local route remain visible."],
    ["03 / TRANSFORM", "Give words the right shape.", "List, email, message, correction or temporary mode: text commands stay explicit and reversible."],
    ["04 / ACT", "Text lands. No surprise.", "Pressay verifies the target, inserts, confirms, then returns to idle. Every external route stays opt-in."],
  ];

  return <section className="scroll-story" ref={rootRef} data-scene="0" data-testid="scroll-story">
    <div className="story-sticky">
      <div className="story-aurora" aria-hidden="true" />
      <div className="story-grid shell">
        <div className="story-copy">
          {chapters.map(([label, title, body], index) => <article className={`story-chapter story-chapter-${index}`} key={label}>
            <span className="mono-label">{label}</span>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>)}
          <div className="story-progress" aria-hidden="true"><i /><i /><i /><i /></div>
        </div>
        <ProductStage locale={locale} />
      </div>
    </div>
  </section>;
}

function ProductStage({ locale }: { locale: Locale }) {
  const fr = locale === "fr";
  return <div className="stage-wrap" role="img" aria-label={fr ? "Démonstration animée de Pressay dans Mail" : "Animated Pressay demonstration in Mail"}>
    <div className="stage-glow" aria-hidden="true" />
    <div className="mac-window">
      <div className="mac-titlebar"><span /><span /><span /><strong>Mail</strong><em>pressay active</em></div>
      <div className="mac-body">
        <aside className="mail-list" aria-hidden="true">
          <div className="mail-search" />
          {[0, 1, 2, 3].map((item) => <div className={`mail-row row-${item}`} key={item}><i /><p><b /> <span /></p></div>)}
        </aside>
        <div className="mail-compose">
          <div className="compose-line"><span>{fr ? "À" : "To"}</span> team@press-say.app</div>
          <div className="compose-line"><span>{fr ? "Objet" : "Subject"}</span> Version 1.2.6</div>
          <div className="compose-editor">
            <p className="typed-before">{fr ? "Bonjour,\n\nla nouvelle version est prête." : "Hi,\n\nthe new version is ready."}</p>
            <p className="typed-result">{fr ? " Le presse-papiers est maintenant restitué après chaque insertion réussie." : " The clipboard is now restored after every successful insertion."}<i /></p>
          </div>
        </div>
      </div>
    </div>

    <div className="pressay-hud">
      <kbd>fn</kbd>
      <div className="hud-wave">{bars.map((height, index) => <i key={index} style={{ "--bar": `${height}%`, "--delay": `${index * -37}ms` } as CSSProperties} />)}</div>
      <div><strong>{fr ? "Écoute" : "Listening"}</strong><span>LOCAL · {fr ? "Relâche pour écrire" : "Release to write"}</span></div>
    </div>

    <div className="target-proof"><span className="proof-pulse" /><small>SIGNAL CAPTURED</small><strong>Mail · Local STT</strong><em>✓</em></div>

    <div className="clipboard-card clipboard-before"><span>VOICE COMMAND</span><strong>{fr ? "liste à puces" : "bullet list"}</strong><small>SAFE TEXT · LOCAL</small></div>
    <div className="clipboard-transfer" aria-hidden="true"><i /><i /><i /></div>
    <div className="clipboard-card clipboard-after"><span>TRANSFORMED</span><strong>• Local first · • BYOK optional</strong><small>{fr ? "aperçu déterministe" : "deterministic preview"}</small></div>

    <div className="consent-panel">
      <div><span>VOICE COMMAND INTENT</span><em>TEXT / SAFE</em></div>
      <dl>
        <dt>{fr ? "Intention" : "Intent"}</dt><dd>FORMAT_LIST</dd>
        <dt>{fr ? "Route" : "Route"}</dt><dd>LOCAL</dd>
        <dt>{fr ? "Risque" : "Risk"}</dt><dd>SAFE_TEXT</dd>
        <dt>{fr ? "Confirmation" : "Confirmation"}</dt><dd>false</dd>
      </dl>
      <div className="consent-seal"><i /> {fr ? "CIBLE VÉRIFIÉE · INSÉRÉ" : "TARGET VERIFIED · INSERTED"}</div>
    </div>
  </div>;
}

export function PageRevealEffects() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach((element) => element.dataset.visible = "true");
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).dataset.visible = "true";
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8%" });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  return null;
}
