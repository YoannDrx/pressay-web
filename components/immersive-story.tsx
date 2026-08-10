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
    ["01 / PARLE", "La pensée devient texte.", "Maintiens Fn, parle normalement, puis relâche. Pressay transcrit sans te sortir de ce que tu fais."],
    ["02 / CIBLE", "Il sait où écrire.", "L’application, la fenêtre et le champ restent visibles. La cible est revérifiée au dernier instant."],
    ["03 / MÉMOIRE", "Ton presse-papiers revient.", "Pressay colle le résultat, puis restitue tous les formats copiés avant la dictée. Si tu copies entre-temps, ta copie gagne."],
    ["04 / CONTEXTE", "Rien d’implicite.", "Tu vois exactement ce qui peut quitter le Mac. Le local reste local, et chaque source cloud est autorisée explicitement."],
  ] : [
    ["01 / SPEAK", "Thought becomes text.", "Hold Fn, speak naturally, then release. Pressay transcribes without pulling you away from your work."],
    ["02 / TARGET", "It knows where to write.", "The app, window and field stay visible. The target is verified again at the very last moment."],
    ["03 / MEMORY", "Your clipboard comes back.", "Pressay pastes the result, then restores every format copied before dictation. If you copy meanwhile, your copy wins."],
    ["04 / CONTEXT", "Nothing is implicit.", "You see exactly what may leave your Mac. Local stays local, and every cloud source is explicitly allowed."],
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
          <div className="compose-line"><span>{fr ? "Objet" : "Subject"}</span> Version 1.2.5</div>
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
      <div><strong>{fr ? "J’écoute" : "Listening"}</strong><span>{fr ? "Relâche pour écrire" : "Release to write"}</span></div>
    </div>

    <div className="target-proof"><span className="proof-pulse" /><small>TARGET VERIFIED</small><strong>Mail · Compose.Body</strong><em>✓</em></div>

    <div className="clipboard-card clipboard-before"><span>BEFORE</span><strong>Quarterly-report.pdf</strong><small>PDF · RTF · PNG</small></div>
    <div className="clipboard-transfer" aria-hidden="true"><i /><i /><i /></div>
    <div className="clipboard-card clipboard-after"><span>RESTORED</span><strong>Quarterly-report.pdf</strong><small>{fr ? "3 formats intacts" : "3 formats intact"}</small></div>

    <div className="consent-panel">
      <div><span>CONTEXT MANIFEST</span><em>LOCAL / BYOK</em></div>
      <dl>
        <dt>{fr ? "Audio" : "Audio"}</dt><dd>LOCAL</dd>
        <dt>{fr ? "Application" : "Application"}</dt><dd>Mail</dd>
        <dt>{fr ? "Texte sélectionné" : "Selected text"}</dt><dd className="blocked">DENIED</dd>
        <dt>{fr ? "Stocker la réponse" : "Store response"}</dt><dd>false</dd>
      </dl>
      <div className="consent-seal"><i /> {fr ? "AUTORISATION EXPLICITE" : "EXPLICIT CONSENT"}</div>
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
