import { ImageResponse } from "next/og";

export const alt = "Pressay — Your Mac, now speaks your language.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
const SIGNAL_BARS = [10, 24, 42, 18, 10] as const;

function SignalMark() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 52,
        height: 52,
        borderRadius: 999,
        background:
          "linear-gradient(145deg, #35c7ff 0%, #318cff 48%, #6c5cff 100%)",
        boxShadow: "inset 0 0 0 4px rgba(255,255,255,.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      }}
    >
      {SIGNAL_BARS.map((height, index) => (
        <i
          key={index}
          style={{
            width: 4,
            height,
            borderRadius: 99,
            background: "#ffffff",
            display: "flex",
          }}
        />
      ))}
    </span>
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
