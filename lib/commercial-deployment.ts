const productionWebProjectID = "prj_0FmTMhNi5iA1hsLynK6Bh6mOJmvk";
const productionWebOrigin = "https://press-say.app";
const productionAPIOrigin = "https://api.press-say.app";

export type WebDeploymentEnvironment = "development" | "staging" | "production";

export type CommercialDeploymentStatus = {
  ready: boolean;
  environment: WebDeploymentEnvironment | "invalid";
  reason:
    | "ready"
    | "invalid_environment"
    | "not_production"
    | "not_vercel_production"
    | "unexpected_vercel_project"
    | "unexpected_web_origin"
    | "unexpected_api_origin";
};

/**
 * Commercial checkout is deliberately pinned to the canonical production
 * deployment. A copied environment variable, preview deployment or staging
 * backend must fail closed instead of creating a mixed-environment purchase.
 */
export function commercialDeploymentStatus(
  source: NodeJS.ProcessEnv = process.env,
): CommercialDeploymentStatus {
  const environment = parseEnvironment(source.PRESSAY_WEB_ENVIRONMENT);
  if (environment === "invalid") {
    return { ready: false, environment, reason: "invalid_environment" };
  }
  if (environment !== "production") {
    return { ready: false, environment, reason: "not_production" };
  }
  if (source.VERCEL !== "1" || source.VERCEL_ENV !== "production") {
    return { ready: false, environment, reason: "not_vercel_production" };
  }
  if (source.VERCEL_PROJECT_ID !== productionWebProjectID) {
    return { ready: false, environment, reason: "unexpected_vercel_project" };
  }
  if (normalizedOrigin(source.PRESSAY_WEB_CANONICAL_ORIGIN) !== productionWebOrigin) {
    return { ready: false, environment, reason: "unexpected_web_origin" };
  }
  if (normalizedOrigin(source.PRESSAY_API_URL) !== productionAPIOrigin) {
    return { ready: false, environment, reason: "unexpected_api_origin" };
  }
  return { ready: true, environment, reason: "ready" };
}

function parseEnvironment(value: string | undefined): WebDeploymentEnvironment | "invalid" {
  return value === "development" || value === "staging" || value === "production"
    ? value
    : "invalid";
}

function normalizedOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}
