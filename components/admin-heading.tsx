export function AdminHeading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return <header className="admin-heading"><div><span className="mono-label">{eyebrow}</span><h1>{title}</h1></div><p>{detail}</p></header>;
}
