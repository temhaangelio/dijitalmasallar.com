import type { CSSProperties } from "react";
import { BrandDigit } from "@/components/ui/brand-mark";

// Deliberate, stable positions leave breathing room around the site's identity.
const positions = [
  [4, 12], [16, 7], [29, 16], [42, 6], [55, 11], [69, 7], [83, 15], [96, 8],
  [9, 33], [22, 30], [35, 36], [48, 27], [62, 32], [76, 29], [90, 35],
  [3, 57], [16, 52], [29, 60], [42, 51], [56, 57], [70, 50], [83, 59], [97, 52],
  [9, 79], [22, 73], [35, 82], [48, 75], [62, 80], [76, 74], [91, 81],
  [3, 95], [17, 91], [30, 99], [43, 93], [57, 97], [70, 91], [83, 98], [97, 93],
] as const;

/** The logo's digits drift like quiet specks of ink, without client-side animation code. */
export function VisitorHeaderBackdrop() {
  return (
    <div className="visitor-header-backdrop" aria-hidden="true">
      <div className="visitor-binary-glow" />
      <div className="visitor-binary-field">
        {positions.map(([x, y], index) => (
          <span
            key={index}
            className="visitor-binary-particle"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              "--binary-size": `${[16, 21, 13, 18, 15][index % 5]}px`,
              "--binary-opacity": [0.18, 0.13, 0.22, 0.16][index % 4],
              "--binary-drift": `${index % 2 === 0 ? 8 : -6}px`,
              "--binary-duration": `${20 + (index % 6) * 3}s`,
              "--binary-delay": `${-((index * 7 + 3) % 31)}s`,
            } as CSSProperties}
          >
            <BrandDigit value={index % 3 === 0 ? "1" : index % 2 === 0 ? "0" : "1"} />
          </span>
        ))}
      </div>
    </div>
  );
}
