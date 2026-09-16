import { pressayJSON } from "@/lib/pressay-api";
export async function adminData<T>(
  path: string,
): Promise<{ data: T | null; error: React.ReactNode }> {
  try {
    const { response, data } = await pressayJSON<T>(path);
    return {
      data,
      error: data ? null : (
        <div className="account-error" role="alert">
          {response.status === 403
            ? "Accès refusé."
            : "Données temporairement indisponibles."}{" "}
          Référence : {response.headers.get("x-request-id") ?? "indisponible"}
        </div>
      ),
    };
  } catch {
    return {
      data: null,
      error: (
        <div className="account-error" role="alert">
          Connexion au service indisponible. Réessaie dans quelques instants.
        </div>
      ),
    };
  }
}
export function AdminTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length ? <p className="admin-empty">Aucun résultat.</p> : null}
    </div>
  );
}
export function adminDate(value: string | null | undefined) {
  return value
    ? new Intl.DateTimeFormat("fr", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
}
