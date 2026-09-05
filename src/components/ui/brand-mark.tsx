/** A fixed binary signature, optically centered in a 100-unit square. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-mark ${className}`} aria-hidden="true">
      <svg viewBox="0 0 100 100" focusable="false">
        <g textAnchor="middle" fontFamily="var(--font-plex-mono), monospace" fontSize="32" fontWeight="700">
          <text className="brand-bit" x="37" y="46">0</text>
          <text className="brand-bit" x="63" y="46">1</text>
          <text className="brand-bit" x="37" y="77">1</text>
          <text className="brand-bit" x="63" y="77">0</text>
        </g>
      </svg>
    </span>
  );
}
