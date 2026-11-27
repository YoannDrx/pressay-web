import { comparison, type Locale } from "@/lib/content";

/**
 * Factual price comparison shared by the landing and the pricing page. The
 * focus column is only shown on the pricing page.
 */
export function ComparisonTable({ locale, withFocus = false }: { locale: Locale; withFocus?: boolean }) {
  const fr = locale === "fr";
  const headers = fr ? ["Produit", "Gratuit", "Mensuel", "Annuel", "À vie"] : ["Product", "Free", "Monthly", "Annual", "Lifetime"];
  return (
    <div className="comparison">
      <div className="table-scroll" role="region" aria-label={fr ? "Comparaison des prix" : "Price comparison"} tabIndex={0}>
        <table>
          <thead>
            <tr>
              {headers.map((header) => <th scope="col" key={header}>{header}</th>)}
              {withFocus ? <th scope="col">{fr ? "Angle" : "Focus"}</th> : null}
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((row) => (
              <tr key={row.name} className={row.ours ? "our-row" : undefined}>
                <th scope="row">{row.name}</th>
                <td>{row.free[locale]}</td>
                <td>{row.monthly[locale]}</td>
                <td>{row.annual[locale]}</td>
                <td>{row.lifetime}</td>
                {withFocus ? <td>{row.focus[locale]}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="source-note">
        {fr
          ? `Prix relevés sur les pages officielles le ${comparison.checkedOn.fr}. Annuel Wispr Flow affiché par mois. Les devises et taxes peuvent varier.`
          : `Prices checked on the official pages on ${comparison.checkedOn.en}. Wispr Flow annual shown per month. Currency and taxes may vary.`}{" "}
        {comparison.sources.map(([name, url], index) => (
          <span key={name}>{index > 0 ? " · " : null}<a href={url} rel="noopener">{name}</a></span>
        ))}
      </p>
    </div>
  );
}
