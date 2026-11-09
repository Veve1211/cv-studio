import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const alt = "Cvéčko – napiš o sobě pár vět, životopis ti poskládá AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fonts = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/SpaceGrotesk-Bold.ttf")),
  readFile(join(process.cwd(), "assets/fonts/Inter-Medium.ttf")),
]);

/** Share image built from the landing design: light-blue glow, headline, CV cards. */
export default async function OpengraphImage() {
  const [grotesk, inter] = await fonts;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #e6f3ff 0%, #f2f8ff 55%, #dceeff 100%)",
          fontFamily: "Inter",
          color: "#0b1b33",
          position: "relative",
          padding: "64px 72px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 560,
            height: 560,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(143,208,255,0.75) 0%, rgba(143,208,255,0) 70%)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", width: 620, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: "Space Grotesk", fontSize: 34 }}>
            <div style={{ width: 18, height: 18, borderRadius: 9999, background: "#0a5fb8" }} />
            {SITE_NAME}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "Space Grotesk", fontSize: 72, lineHeight: 1.02, letterSpacing: -2.5 }}>
              Napiš o sobě pár vět. Životopis ti poskládá AI.
            </div>
            <div style={{ marginTop: 26, fontSize: 30, color: "#2c3e5a" }}>Bez formulářů. Vlož text, máš životopis.</div>
          </div>
          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                background: "#8fd0ff",
                borderRadius: 9999,
                padding: "16px 32px",
                fontSize: 28,
                fontFamily: "Space Grotesk",
              }}
            >
              Náhled zdarma
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", position: "relative" }}>
          {[
            { rotate: -7, x: -70, y: 30, head: "#0b1b33", accent: "#0a66b8" },
            { rotate: 5, x: 70, y: -10, head: "#0a66b8", accent: "#ffffff" },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                display: "flex",
                flexDirection: "column",
                width: 300,
                height: 420,
                background: "#ffffff",
                borderRadius: 10,
                boxShadow: "0 30px 60px rgba(10,60,120,0.22)",
                transform: `translate(${card.x}px, ${card.y}px) rotate(${card.rotate}deg)`,
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", height: i === 1 ? 110 : 0, background: card.head }} />
              <div style={{ display: "flex", flexDirection: "column", padding: 26, gap: 12 }}>
                <div style={{ width: 190, height: 22, borderRadius: 4, background: i === 1 ? "#0b1b33" : card.head }} />
                <div style={{ width: 120, height: 12, borderRadius: 4, background: "#0a66b8" }} />
                {[230, 210, 240, 180, 220, 160, 200].map((w, j) => (
                  <div key={j} style={{ width: w, height: 9, borderRadius: 4, background: "#d5e5f6", marginTop: j === 0 ? 16 : 0 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Space Grotesk", data: grotesk, style: "normal", weight: 700 },
        { name: "Inter", data: inter, style: "normal", weight: 500 },
      ],
    },
  );
}
