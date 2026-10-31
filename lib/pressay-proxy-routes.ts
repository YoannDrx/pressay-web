/**
 * Routes the browser may reach through the generic `/api/pressay/*` proxy,
 * which signs each request with the caller's web session. Only the exact
 * method and path pairs used by client components are relayed; everything
 * else is refused before any Cloud call.
 *
 * Account routes (`me`, `me/*`) are never relayed: account deletion goes
 * through Better Auth's `/api/auth/delete-user`, which requires a recent
 * sign-in, and server components read account data with `pressayAPI`
 * directly. Add a route here only together with the client code that needs it.
 */
const ID = "[A-Za-z0-9_-]+";

const relayedRoutes: ReadonlyArray<{
  methods: readonly string[];
  pattern: RegExp;
}> = [
  // Account area
  { methods: ["POST"], pattern: /^access\/claim$/ },
  { methods: ["DELETE"], pattern: new RegExp(`^devices/${ID}$`) },
  // Administration (owner role and step-up are enforced by the Cloud)
  { methods: ["POST"], pattern: /^admin\/campaigns$/ },
  {
    methods: ["GET", "HEAD"],
    pattern: new RegExp(`^admin/campaigns/${ID}/usage$`),
  },
  {
    methods: ["POST"],
    pattern: new RegExp(`^admin/campaigns/${ID}/revoke$`),
  },
  { methods: ["POST"], pattern: new RegExp(`^admin/grants/${ID}/revoke$`) },
  { methods: ["PATCH"], pattern: new RegExp(`^admin/gates/${ID}/${ID}$`) },
  { methods: ["POST"], pattern: /^admin\/rewards\/process$/ },
  { methods: ["POST"], pattern: new RegExp(`^admin/rewards/${ID}/retry$`) },
];

export type ProxyRouteDecision =
  | { allowed: true; target: string }
  | { allowed: false; status: 403 | 404; error: string };

const notAllowed: ProxyRouteDecision = {
  allowed: false,
  status: 404,
  error: "route_not_allowed",
};

/**
 * Decide whether `method` on the catch-all `segments` (as decoded by Next.js)
 * may be relayed. Segments are restricted to `[A-Za-z0-9_-]`, so encoded
 * slashes, dots, empty segments and traversal never reach the matcher, and
 * matching is exact and case-sensitive.
 */
export function proxyRoute(
  method: string,
  segments: readonly string[],
): ProxyRouteDecision {
  if (
    segments.length === 0 ||
    segments.some((segment) => !/^[A-Za-z0-9_-]+$/.test(segment))
  )
    return notAllowed;
  const target = segments.join("/");
  // Referral attribution accepts only the verified cookie, through
  // /api/referral/attribute or Checkout, never a client-selected timestamp.
  if (target.startsWith("referrals/") && !["GET", "HEAD"].includes(method))
    return { allowed: false, status: 403, error: "signed_referral_required" };
  const relayed = relayedRoutes.some(
    (route) => route.methods.includes(method) && route.pattern.test(target),
  );
  return relayed ? { allowed: true, target } : notAllowed;
}
