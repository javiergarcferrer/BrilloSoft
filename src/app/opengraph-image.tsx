import { ImageResponse } from "next/og";

export const alt = "LicitaRD — Inteligencia de licitaciones públicas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 90,
          background:
            "linear-gradient(135deg, #101f43 0%, #1b40ae 55%, #06b6d4 140%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 30,
            letterSpacing: 2,
            color: "#a5f0fc",
          }}
        >
          <div
            style={{
              display: "flex",
              height: 56,
              width: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #3366f0, #06b6d4)",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: "#ffffff",
            }}
          >
            L
          </div>
          LicitaRD
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 82,
            fontWeight: 700,
            lineHeight: 1.05,
            marginTop: 28,
            maxWidth: 980,
          }}
        >
          Toda licitación pública, en un solo lugar inteligente.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "#bdd2fd",
            marginTop: 26,
            maxWidth: 940,
          }}
        >
          Busca · organiza · da seguimiento — República Dominicana
        </div>
      </div>
    ),
    { ...size },
  );
}
