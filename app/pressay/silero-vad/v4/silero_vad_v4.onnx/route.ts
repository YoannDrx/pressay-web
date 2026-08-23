import { NextResponse } from "next/server";

const immutableArtifact =
  "https://raw.githubusercontent.com/YoannDrx/pressay/v2.0.0-beta.3/src-tauri/resources/models/silero_vad_v4.onnx";

export function GET() {
  const response = NextResponse.redirect(immutableArtifact, 308);
  response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return response;
}
