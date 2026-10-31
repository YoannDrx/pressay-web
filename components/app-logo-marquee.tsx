import { brandIconFile, marqueeApplications, type MarqueeApplication } from "@/lib/brand-icons";

export function AppLogoMarquee({ locale }: { locale: "fr" | "en" }) {
  return <div className="app-logo-field">
    <ul className="sr-only" aria-label={locale === "fr" ? "Applications compatibles" : "Compatible applications"}>
      {marqueeApplications.map(([name]) => <li key={name}>{name}</li>)}
    </ul>
    <Track applications={marqueeApplications.slice(0, 7)} />
    <Track applications={marqueeApplications.slice(7)} reverse />
  </div>;
}

function Track({ applications: track, reverse = false }: { applications: readonly MarqueeApplication[]; reverse?: boolean }) {
  return <div className={`logo-track ${reverse ? "logo-track-reverse" : ""}`} aria-hidden="true">
    <div>{[...track, ...track].map((application, index) => {
      const [name, icon] = application;
      const source = application.length > 2 ? application[2] : "logos";
      return <span className="app-logo-card" key={`${name}-${index}`}>
        {/* Decorative files from /brand-icons, cached by the CDN; the alt text
            lives in the screen-reader list above. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, nothing to optimize */}
        <img className="brand-icon" src={`/brand-icons/${brandIconFile(icon, source)}`} alt="" width={27} height={27} decoding="async" fetchPriority="low" />
        <b>{name}</b>
      </span>;
    })}</div>
  </div>;
}
