import "server-only";
import { cache } from "react";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { identityProvider, type IdentityProvider } from "@/lib/auth-env";
import { readStepUpProof } from "@/lib/step-up";
import { readSessionWithRetry } from "@/lib/session-read";

export type WebIdentity = {
  provider: Exclude<IdentityProvider, "disabled">;
  subject: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
  sessionID?: string;
  stepUpAt?: number;
  stepUpMethod?: string;
  clerkToken?: string;
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
      stepUpAt: stepUp?.iat,
      stepUpMethod: stepUp?.method,
    };
  }
  if (provider === "clerk") {
    const current = await clerkAuth();
    if (!current.userId) return null;
    const token = await current.getToken({ template: "pressay-api" });
    if (!token) return null;
    return {
      provider,
      subject: current.userId,
      emailVerified: false,
      clerkToken: token,
    };
  }
  return null;
});
