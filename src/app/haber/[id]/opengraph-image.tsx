import { ImageResponse } from "next/og";
import { brandMarkDataUri } from "@/lib/og-mark";
import { getPublishedPostById } from "@/services/posts";
import { postHeadline } from "@/lib/seo";

/**
 * The card a single note shows when it is shared.
 *
 * A note that carries a cover image uses that — `generateMetadata` sets it, and an explicit image
 * wins over this file. What is left is every note without one, which until now was shared as a bare
 * link: this draws the headline instead, so the share says what the note says.
 *
 * Turkish is the site's primary language and an image route has no `?lang=` to read, so the card is
 * always the Turkish headline.
 */
export const alt = "Dijital Masallar haber notu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const dayFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" });

export default async function PostOpengraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPublishedPostById(id, "tr");
  const headline = post ? postHeadline(post) : "Dijital Masallar";
  const published = post?.published_at ?? post?.created_at;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          color: "#0a0a0a",
          padding: "68px 76px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* Plain <img>: the card is drawn by satori, which has no next/image. */}
          <img src={brandMarkDataUri({ square: "#171717", digits: "#ffffff" })} width={64} height={64} alt="" />
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700, letterSpacing: -1 }}>Dijital Masallar</div>
        </div>

        {/* The headline is the whole card; a long one steps down a size rather than spilling off it. */}
        <div
          style={{
            display: "flex",
            fontSize: headline.length > 78 ? 50 : 62,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1.18,
            maxWidth: 1000,
          }}
        >
          {headline}
        </div>

        <div style={{ display: "flex", fontSize: 26, color: "#6a6a6a" }}>
          {published ? `${dayFormat.format(new Date(published))} · ` : ""}dijitalmasallar.com
        </div>
      </div>
    ),
    size,
  );
}
