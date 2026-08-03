"use client";
export function PortalButton({ children }: { children: React.ReactNode }) { async function openPortal() { const response = await fetch("/api/portal", { method: "POST" }); const payload = await response.json() as { url?: string }; if (payload.url) window.location.assign(payload.url); } return <button className="button button-primary" onClick={openPortal}>{children}</button>; }
