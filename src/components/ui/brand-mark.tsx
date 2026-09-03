"use client";

import { useEffect, useState } from "react";

type Bit = { value: string; revision: number };

const weightedDigits = ["0", "0", "0", "0", "0", "0", "1", "1", "1", "1", "1", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

function nextDigit() {
  return weightedDigits[Math.floor(Math.random() * weightedDigits.length)] ?? "0";
}

export function BrandMark({ className = "" }: { className?: string }) {
  const [bits, setBits] = useState<Bit[]>([
    { value: "0", revision: 0 },
    { value: "1", revision: 0 },
    { value: "1", revision: 0 },
    { value: "0", revision: 0 },
  ]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function scheduleChange() {
      timer = setTimeout(() => {
        setBits((current) => {
          const next = [...current];
          const changes = Math.random() > 0.72 ? 2 : 1;
          const indexes = new Set<number>();
          while (indexes.size < changes) indexes.add(Math.floor(Math.random() * next.length));
          for (const index of indexes) {
            const bit = next[index];
            next[index] = { value: nextDigit(), revision: bit.revision + 1 };
          }
          return next;
        });
        scheduleChange();
      }, 260 + Math.random() * 300);
    }

    scheduleChange();
    return () => clearTimeout(timer);
  }, []);

  return (
    <span className={`brand-mark ${className}`} aria-hidden="true">
      <svg viewBox="0 0 100 100" focusable="false">
        <g className="brand-bits" textAnchor="middle" fontFamily="var(--font-montserrat), Montserrat, sans-serif" fontSize="28" fontWeight="800">
          {bits.map((bit, index) => {
            const binaryClass = bit.value === "0" ? "brand-bit-zero" : bit.value === "1" ? "brand-bit-one" : "brand-bit-decimal";
            const x = index % 2 === 0 ? 37 : 63;
            const y = index < 2 ? 45 : 72;
            return <text key={`${index}-${bit.revision}`} className={`brand-bit ${binaryClass}`} x={x} y={y}>{bit.value}</text>;
          })}
        </g>
      </svg>
    </span>
  );
}
