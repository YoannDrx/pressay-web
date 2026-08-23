export function LandingEffects() {
  return <script dangerouslySetInnerHTML={{ __html: `(() => {
    const initialize = () => {
      const story = document.querySelector("[data-testid='scroll-story']");
      const reveals = Array.from(document.querySelectorAll("[data-reveal]"));
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let frame = 0;
      const update = () => {
        frame = 0;
        if (!story) return;
        const rect = story.getBoundingClientRect();
        const travel = Math.max(1, story.offsetHeight - window.innerHeight);
        const progress = Math.min(1, Math.max(0, -rect.top / travel));
        story.style.setProperty("--story-progress", progress.toFixed(4));
        story.dataset.scene = String(Math.min(3, Math.floor(progress * 4)));
      };
      const schedule = () => {
        if (!frame && !reduced) frame = window.requestAnimationFrame(update);
      };
      update();
      if (reduced) {
        reveals.forEach((element) => { element.dataset.visible = "true"; });
        return;
      }
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule, { passive: true });
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.dataset.visible = "true";
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.16, rootMargin: "0px 0px -8%" });
      reveals.forEach((element) => observer.observe(element));
    };
    window.addEventListener("load", () => window.setTimeout(initialize, 250), { once: true });
  })();` }} />;
}
