"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ReferralAttributor() {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/referral/attribute", { method: "POST" })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as {
          attributed?: boolean;
          attribution?: unknown;
        } | null;
        if (response.ok && (result?.attributed === true || result?.attribution))
          router.refresh();
      })
      .catch(() => undefined);
  }, [router]);
  return null;
}
