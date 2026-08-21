import { ImageResponse } from "next/og";

export const alt = "Pressay — Your Mac, now speaks your language.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
function SignalMark() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{
        display: "flex",
      }}
    >
      <defs>
        <linearGradient
          id="og-signal"
          x1="10"
          y1="8"
          x2="54"
          y2="58"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#35C7FF" />
          <stop offset="0.46" stopColor="#318CFF" />
          <stop offset="1" stopColor="#6C5CFF" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#og-signal)" />
      <circle
        cx="32"
        cy="32"
        r="25.5"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.19"
      />
      <path
        d="M18.5 25.5C21.7 20.8 26.5 18.5 32 18.5s10.3 2.3 13.5 7M18.5 38.5C21.7 43.2 26.5 45.5 32 45.5s10.3-2.3 13.5-7"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.54"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18.5 32h3.2m3.1-5.7v11.4m5.1-16v20.6m5.1-10.9v1.2m4.7-.6h4.1"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        color: "#f4f0e7",
        background: "#0d0c10",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34 }}
      >
        <SignalMark />
        Pressay
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 80,
          maxWidth: 980,
          letterSpacing: -4,
          lineHeight: 1,
        }}
      >
        <span>Your Mac, now speaks</span>
        <span>your language.</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 24,
          color: "#aaa5b2",
        }}
      >
        <span>PRIVATE VOICE OS FOR macOS</span>
        <span>press-say.app</span>
      </div>
    </div>,
    size,
  );
}
