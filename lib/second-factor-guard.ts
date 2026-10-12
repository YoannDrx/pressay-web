import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { symmetricDecrypt } from "better-auth/crypto";
import { createOTP } from "@better-auth/utils/otp";

/**
 * Pressay accounts have no password, so Better Auth's `allowPasswordless`
 * two-factor mode would let anyone holding a session cookie disable the
 * authenticator, enrol their own and pass the admin step-up. This guard
 * restores proof of possession:
 *
 * - disabling TOTP or regenerating backup codes requires a valid current
 *   TOTP code (`code` in the request body);
 * - enrolling an authenticator requires a fresh session (signed in within the
 *   session `freshAge`), so an old stolen cookie cannot enrol one.
 */
export const GUARDED_SECOND_FACTOR_PATHS = [
  "/two-factor/disable",
  "/two-factor/generate-backup-codes",
] as const;
const ENROLMENT_PATH = "/two-factor/enable";

export function secondFactorChangeGuard(): BetterAuthPlugin {
  return {
    id: "pressay-second-factor-guard",
    hooks: {
      before: [
        {
          matcher: (context) =>
            context.path === ENROLMENT_PATH ||
            (GUARDED_SECOND_FACTOR_PATHS as readonly string[]).includes(
              context.path ?? "",
            ),
          handler: createAuthMiddleware(async (ctx) => {
            const session = await getSessionFromCtx(ctx, {
              disableCookieCache: true,
            });
            // Unauthenticated requests are rejected by the endpoint itself.
            if (!session?.session) return;
            const twoFactor = (await ctx.context.adapter.findOne({
              model: "twoFactor",
              where: [{ field: "userId", value: session.user.id }],
            })) as { secret: string; verified?: boolean | null } | null;
            const verified = Boolean(twoFactor && twoFactor.verified !== false);

            if (ctx.path === ENROLMENT_PATH) {
              const freshAge = ctx.context.sessionConfig.freshAge * 1_000;
              const age =
                Date.now() - new Date(session.session.createdAt).getTime();
              if (!verified && freshAge > 0 && age >= freshAge)
                throw APIError.from("FORBIDDEN", {
                  code: "SESSION_NOT_FRESH",
                  message: "A recent sign-in is required to add an authenticator",
                });
              return;
            }

            if (!verified || !twoFactor) return;
            const code = String(
              (ctx.body as { code?: unknown } | undefined)?.code ?? "",
            ).replace(/[\s-]/g, "");
            const valid =
              /^\d{6}$/.test(code) &&
              (await createOTP(
                await symmetricDecrypt({
                  key: ctx.context.secretConfig,
                  data: twoFactor.secret,
                }),
              ).verify(code));
            if (!valid)
              throw APIError.from("FORBIDDEN", {
                code: "TOTP_CODE_REQUIRED",
                message: "A valid authenticator code is required",
              });
          }),
        },
      ],
    },
  };
}
