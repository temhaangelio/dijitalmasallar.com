// Outlined glyphs keep the browser logo and installed app icons identical on every platform.
const zero = "M9 0C2.5 0 0 4 0 12S2.5 24 9 24s9-4 9-12S15.5 0 9 0ZM9 4c3.4 0 4.5 2.5 4.5 8S12.4 20 9 20s-4.5-2.5-4.5-8S5.6 4 9 4ZM7.5 10h3v4h-3Z";
const one = "M2 5 8 0h5v20h5v4H1v-4h7V5L4 8Z";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-mark ${className}`} aria-hidden="true">
      <svg viewBox="0 0 100 100" focusable="false">
        <g fillRule="evenodd">
          {[
            { x: 28, y: 23, initial: zero, alternate: one },
            { x: 54, y: 23, initial: one, alternate: zero },
            { x: 28, y: 54, initial: one, alternate: zero },
            { x: 54, y: 54, initial: zero, alternate: one },
          ].map((bit, index) => (
            <g key={index} className={`brand-cell brand-cell-${index}`} transform={`translate(${bit.x} ${bit.y})`}>
              <path className="brand-bit brand-bit-initial" d={bit.initial} />
              <path className="brand-bit brand-bit-alternate" d={bit.alternate} />
            </g>
          ))}
        </g>
      </svg>
    </span>
  );
}
