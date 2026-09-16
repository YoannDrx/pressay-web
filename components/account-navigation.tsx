"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function AccountNavigation({ locale }: { locale: "fr" | "en" }) {
  const path = usePathname();
  const fr = locale === "fr";
  const items = [
    ["/account", fr ? "Vue d’ensemble" : "Overview"],
    ["/account/billing", fr ? "Abonnement" : "Subscription"],
    ["/account/devices", fr ? "Appareils" : "Devices"],
    ["/account/referrals", fr ? "Parrainage" : "Referrals"],
    ["/account/security", fr ? "Sécurité" : "Security"],
  ];
  return (
    <nav
      className="account-navigation"
      aria-label={fr ? "Navigation du compte" : "Account navigation"}
    >
      {items.map(([href, label]) => (
        <Link
          href={href}
          key={href}
          aria-current={path === href ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
