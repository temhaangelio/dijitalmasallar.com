// Outlined glyphs keep the browser logo and installed app icons identical on every platform.
// Geometric bowls and plain stems match the custom wordmark's lettering.
const zero = "M9 0C3.2 0 0 4.5 0 12s3.2 12 9 12 9-4.5 9-12S14.8 0 9 0ZM9 4.5c3.1 0 4.5 2.5 4.5 7.5s-1.4 7.5-4.5 7.5S4.5 17 4.5 12 5.9 4.5 9 4.5Z";
const one = "M3 5.5 9.5 0H14V24H9.5V5.8L5.4 9Z";

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

/** Reuse the logo's outlined digits in decorative header animations. */
export function BrandDigit({ value, className }: { value: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 24" fill="currentColor" fillRule="evenodd" aria-hidden="true" focusable="false">
      <path d={value === "0" ? zero : one} />
    </svg>
  );
}
