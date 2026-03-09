import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const svgContent = readFileSync(
  join(process.cwd(), "src/app/icon.svg"),
  "utf-8"
);
const svgBase64 = Buffer.from(svgContent).toString("base64");
const svgDataUri = `data:image/svg+xml;base64,${svgBase64}`;

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={svgDataUri} width={180} height={180} alt="" />
      </div>
    ),
    { ...size }
  );
}
