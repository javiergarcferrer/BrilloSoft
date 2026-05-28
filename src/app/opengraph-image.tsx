import { ImageResponse } from "next/og";

export const alt = "Vista Verde — Cuidamos tus espacios";
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
            "linear-gradient(135deg, #274e38 0%, #2f6144 50%, #0e1d15 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#8eba9c",
          }}
        >
          Vista Verde
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1.05,
            marginTop: 18,
          }}
        >
          Cuidamos tus espacios
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            color: "#b9d4c1",
            marginTop: 26,
            maxWidth: 940,
          }}
        >
          Limpieza y mantenimiento profesional · Productos Ecolab · +15 años de
          experiencia
        </div>
      </div>
    ),
    { ...size },
  );
}
