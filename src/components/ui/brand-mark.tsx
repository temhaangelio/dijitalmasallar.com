"use client";

import { useEffect, useState } from "react";

/*
 * The mark counts. Four cells, read as a four-bit number, incrementing once a second and wrapping
 * at 15 — so the digits that flip are the ones a binary counter would actually flip, the low bit
 * every step and the high bit once a cycle.
 *
 * It used to pick each cell at random from a pool that included 2-9, which meant the mark spent
 * most of its life showing things like 49 / 10 or 87 / 55: four random numerals rather than a
 * binary anything, with every cell twitching on its own schedule.
 */
const cycleMs = 1000;
const startValue = 0b0110;

function bitsOf(value: number) {
  return [3, 2, 1, 0].map((position) => ((value >> position) & 1 ? "1" : "0"));
}

export function BrandMark({ className = "" }: { className?: string }) {
  const [value, setValue] = useState(startValue);

  useEffect(() => {
    // Reduced motion stopped the CSS transition but not the counter, so the digits went on
    // changing under a reader who had asked for stillness. Now the counter stops too.
    const stillness = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (stillness.matches) return;
    const timer = setInterval(() => setValue((current) => (current + 1) % 16), cycleMs);
    return () => clearInterval(timer);
  }, []);

  const bits = bitsOf(value);

  return (
    <span className={`brand-mark ${className}`} aria-hidden="true">
      <svg viewBox="0 0 100 100" focusable="false">
        <g className="brand-bits" textAnchor="middle" fontFamily="var(--font-montserrat), Montserrat, sans-serif" fontSize="28" fontWeight="800">
          {bits.map((bit, index) => {
            const x = index % 2 === 0 ? 37 : 63;
            const y = index < 2 ? 45 : 72;
            /* Keyed by its own value so a cell re-mounts — and so replays the flip — only when the
               digit it shows actually changes. */
            return <text key={`${index}-${bit}`} className="brand-bit" x={x} y={y}>{bit}</text>;
          })}
        </g>
      </svg>
    </span>
  );
}
