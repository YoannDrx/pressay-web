import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { identityProvider, type IdentityProvider } from "@/lib/auth-env";
import { sessionSignedInAt } from "@/lib/account-deletion";
import { readStepUpProof } from "@/lib/step-up";
import { readSessionWithRetry } from "@/lib/session-read";

export type WebIdentity = {
  provider: Exclude<IdentityProvider, "disabled">;
  subject: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
  sessionID?: string;
  /** When this session signed in (seconds since epoch). */
  signedInAt?: number;
  stepUpAt?: number;
  stepUpMethod?: string;
};

// Share one session lookup across the layout and account sections in this render.
// React invalidates this cache for every server request; no identity is shared.
export const getWebIdentity = cache(async (): Promise<WebIdentity | null> => {
  const provider = identityProvider();
  if (provider === "better-auth") {
    const requestHeaders = await headers();
    const current = await readSessionWithRetry(() =>
      auth.api.getSession({ headers: requestHeaders }),
    );
    if (!current?.user?.id) return null;
    const stepUp = await readStepUpProof(current.user.id, current.session.id);
    return {
      provider,
      subject: current.user.id,
      email: current.user.email,
      emailVerified: current.user.emailVerified === true,
      name: current.user.name,
      sessionID: current.session.id,
      signedInAt: sessionSignedInAt(current.session.createdAt),
      stepUpAt: stepUp?.iat,
      stepUpMethod: stepUp?.method,
    };
  }
  return null;
});
