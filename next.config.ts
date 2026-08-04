import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://clerk.press-say.app",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://img.clerk.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.press-say.app https://api-staging.press-say.app https://*.clerk.accounts.dev https://clerk.press-say.app https://accounts.press-say.app",
  "frame-src 'self' https://*.clerk.accounts.dev https://clerk.press-say.app https://accounts.press-say.app https://checkout.stripe.com",
  "upgrade-insecure-requests"
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.press-say.app" }],
        destination: "https://press-say.app/:path*",
        permanent: true
      }
    ];
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(), payment=(self)" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }
      ]
    }];
  }
};

export default nextConfig;
