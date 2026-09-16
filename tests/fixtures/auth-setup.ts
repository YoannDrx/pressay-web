import { getMigrations } from "better-auth/db/migration";
import { authOptions } from "../../lib/auth";
const url = new URL(process.env.DATABASE_URL!);
if (
  !["localhost", "127.0.0.1"].includes(url.hostname) ||
  url.pathname !== "/pressay_web_e2e"
)
  throw new Error(
    "This fixture requires an isolated local pressay_web_e2e database",
  );
await (await getMigrations(authOptions)).runMigrations();
await authOptions.database.end();
