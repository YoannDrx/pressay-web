import { cookies, headers } from "next/headers";
export async function accountLocale(): Promise<"fr" | "en"> {
  const selected = (await cookies()).get("pressay_locale")?.value;
  if (selected === "en" || selected === "fr") return selected;
  return (await headers())
    .get("accept-language")
    ?.toLowerCase()
    .startsWith("fr")
    ? "fr"
    : "en";
}
