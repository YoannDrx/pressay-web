import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://*.clerk.accounts.dev https://clerk.press-say.app`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://img.clerk.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.press-say.app https://api-staging.press-say.app https://*.clerk.accounts.dev https://clerk.press-say.app https://accounts.press-say.app",
  "frame-src 'self' https://*.clerk.accounts.dev https://clerk.press-say.app https://accounts.press-say.app https://checkout.stripe.com",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"])
].join("; ");

const modelRedirects = [
  {
    source: "/pressay/parakeet-v3/v1/parakeet-tdt-0.6b-v3-Q8_0.gguf",
    destination:
      "https://huggingface.co/memoravox/parakeet-tdt-0.6b-v3-gguf/resolve/main/parakeet-tdt-0.6b-v3-Q8_0.gguf?download=true"
  },
  {
    source: "/pressay/whisper-small/v1/whisper-small-Q8_0.gguf",
    destination:
      "https://huggingface.co/memoravox/whisper-small-gguf/resolve/main/whisper-small-Q8_0.gguf?download=true"
  },
  {
    source: "/pressay/whisper-large/v1/whisper-large-v3-Q5_K_M.gguf",
    destination:
      "https://huggingface.co/memoravox/whisper-large-v3-gguf/resolve/main/whisper-large-v3-Q5_K_M.gguf?download=true"
  }
] as const;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/silero_vad_v4.onnx",
        has: [{ type: "host" as const, value: "models.press-say.app" }],
        destination:
          "https://models.press-say.app/pressay/silero-vad/v4/silero_vad_v4.onnx",
        permanent: false
      },
      ...modelRedirects.map(({ source, destination }) => ({
        source,
        has: [{ type: "host" as const, value: "models.press-say.app" }],
        destination,
        permanent: false
      })),
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.press-say.app" }],
        destination: "https://press-say.app/:path*",
        permanent: true
      }
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(), payment=(self)" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }
        ]
      }
    ];
  }
};

export default nextConfig;
