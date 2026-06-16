import { ImageResponse } from "@vercel/og";
import { DATOS, datoDia } from "./data/datos-curiosos.js";

export const config = { runtime: "edge" };

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const idx = searchParams.get("dato");
  const dato = idx !== null ? DATOS[Number(idx) % DATOS.length] : datoDia();

  return new ImageResponse(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0f1117",
          padding: "60px 64px",
          fontFamily: "sans-serif",
          position: "relative",
        },
        children: [
          // Barra lateral de color
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                top: 0, left: 0,
                width: 8, height: "100%",
                background: dato.color,
                borderRadius: "0 4px 4px 0",
              },
            },
          },
          // Header QVAG
          {
            type: "div",
            props: {
              style: {
                fontSize: 18,
                color: "#ffffff40",
                fontWeight: 600,
                letterSpacing: "0.12em",
                marginBottom: 32,
                textTransform: "uppercase",
              },
              children: "MUNDIAL 2026 · DATO CURIOSO",
            },
          },
          // Tag
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                marginBottom: 24,
              },
              children: {
                type: "div",
                props: {
                  style: {
                    fontSize: 20,
                    fontWeight: 600,
                    color: dato.color,
                    background: dato.color + "20",
                    padding: "6px 18px",
                    borderRadius: 20,
                    border: `1px solid ${dato.color}40`,
                  },
                  children: dato.tag,
                },
              },
            },
          },
          // Número grande (si existe)
          dato.num ? {
            type: "div",
            props: {
              style: { fontSize: 80, fontWeight: 700, color: "#ffffff", lineHeight: 1, marginBottom: 16 },
              children: dato.num,
            },
          } : null,
          // Título
          {
            type: "div",
            props: {
              style: { fontSize: 36, fontWeight: 600, color: "#ffffff", lineHeight: 1.25, marginBottom: 24 },
              children: dato.titulo,
            },
          },
          // Separador
          {
            type: "div",
            props: {
              style: { width: 60, height: 2, background: dato.color, marginBottom: 24, borderRadius: 2 },
            },
          },
          // Cuerpo
          {
            type: "div",
            props: {
              style: { fontSize: 24, color: "#ffffffb0", lineHeight: 1.6 },
              children: dato.cuerpo,
            },
          },
          // Footer
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                bottom: 48, right: 64,
                fontSize: 18,
                color: "#ffffff30",
                fontWeight: 600,
              },
              children: "quienvaaganar.vercel.app",
            },
          },
        ].filter(Boolean),
      },
    },
    { width: 1080, height: 1080 }
  );
}
