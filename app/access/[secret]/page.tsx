import Link from "next/link";
import { AccessClaimForm } from "@/components/account-actions";
import { commercialIsConfigured } from "@/lib/pressay-api";
export default async function AccessPage({ params }: { params: Promise<{ secret: string }> }) { const { secret } = await params; return <main className="auth-page"><div className="auth-placeholder"><span className="mono-label">PRESSAY / GUEST ACCESS</span><h1>Active ton accès.</h1><p>Connecte-toi, puis utilise ce lien à usage limité. Le secret n’est stocké que sous forme de hash.</p>{commercialIsConfigured() ? <AccessClaimForm delivery="link" presetSecret={secret} /> : <Link className="button" href={`/sign-in?redirect_url=${encodeURIComponent(`/access/${secret}`)}`}>Connexion</Link>}</div></main>; }
