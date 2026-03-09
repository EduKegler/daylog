import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Daylog — Your daily task tracker";

const svgContent = readFileSync(
  join(process.cwd(), "src/app/icon.svg"),
  "utf-8"
);
const svgBase64 = Buffer.from(svgContent).toString("base64");
const svgDataUri = `data:image/svg+xml;base64,${svgBase64}`;

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#F7F6F3",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={svgDataUri} width={120} height={120} alt="" />
        <div
          style={{
            fontSize: 64,
            fontFamily: "Georgia, serif",
            color: "#1c1917",
            marginTop: 24,
          }}
        >
          daylog
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#78716c",
            marginTop: 8,
          }}
        >
          Your daily task tracker
        </div>
      </div>
    ),
    { ...size }
  );
}
