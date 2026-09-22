import { ImageResponse } from "next/og";
import { brandMarkDataUri } from "@/lib/og-mark";

/**
 * The card every share of the site itself shows — in a message, a timeline, or an assistant's
 * answer. Without one, those surfaces fall back to a bare link or to whatever image they scrape.
 *
 * Drawn rather than stored: the wordmark's own font is the only asset, so the card cannot drift out
 * of step with the site the way an exported PNG does.
 */
export const alt = "Dijital Masallar — teknoloji, yapay zekâ, bilim ve dijital kültürden kısa notlar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          color: "#ffffff",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* The mark inverts on the dark ground, the way it does in the site's dark theme. */}
          {/* Plain <img>: the card is drawn by satori, which has no next/image. */}
          <img src={brandMarkDataUri({ square: "#ffffff", digits: "#0a0a0a" })} width={76} height={76} alt="" />
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: -1.5 }}>Dijital Masallar</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 62, fontWeight: 700, letterSpacing: -2.4, lineHeight: 1.15, maxWidth: 900 }}>
            Teknoloji, yapay zekâ, bilim ve dijital kültürden kısa notlar
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#a1a1a1" }}>
            Short, sourced notes — every day · dijitalmasallar.com
          </div>
        </div>
      </div>
    ),
    size,
  );
}
