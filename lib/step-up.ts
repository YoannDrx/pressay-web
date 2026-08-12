import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

const COOKIE_NAME = "pressay_admin_step_up";
const MAX_AGE_SECONDS = 10 * 60;

type StepUpProof = {
  sub: string;
  sid: string;
  iat: number;
  exp: number;
  method: "totp" | "backup_code";
};

export function setStepUpCookie(
  response: NextResponse,
  subject: string,
  sessionID: string,
  method: StepUpProof["method"]
): void {
  const now = Math.floor(Date.now() / 1000);
  const encoded = Buffer.from(JSON.stringify({
    sub: subject,
    sid: sessionID,
    iat: now,
    exp: now + MAX_AGE_SECONDS,
    method
  } satisfies StepUpProof)).toString("base64url");
  const signature = sign(encoded);
  if (!signature) return;
  response.cookies.set(COOKIE_NAME, `${encoded}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE_SECONDS
  });
}

export async function readStepUpProof(
  subject: string,
  sessionID: string
): Promise<StepUpProof | null> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return null;
  const separator = value.lastIndexOf(".");
  if (separator < 1) return null;
  const encoded = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = sign(encoded);
  if (!expected) return null;
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) return null;
  try {
    const proof = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as StepUpProof;
    const now = Math.floor(Date.now() / 1000);
    if (
      proof.sub !== subject ||
      proof.sid !== sessionID ||
      !["totp", "backup_code"].includes(proof.method) ||
      !Number.isFinite(proof.iat) ||
      !Number.isFinite(proof.exp) ||
      proof.iat > now + 60 ||
      proof.exp <= now ||
      proof.exp - proof.iat > MAX_AGE_SECONDS
    ) return null;
    return proof;
  } catch {
    return null;
  }
}

function sign(value: string): string | null {
  const secret = process.env.PRESSAY_INTERNAL_JWT_SECRET;
  if (!secret || secret.length < 32) return null;
  return createHmac("sha256", secret).update(value).digest("base64url");
}
