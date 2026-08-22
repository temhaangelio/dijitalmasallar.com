import type { ReactNode } from "react";

function renderInline(value: string, keyPrefix: string): ReactNode[] {
  const pattern = /(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|_([^_\n]+)_|\*([^*\n]+)\*|`([^`]+)`|~~([^~]+)~~|==([^=]+)==)/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > cursor) nodes.push(value.slice(cursor, match.index));
    const key = `${keyPrefix}-${match.index}`;
    if (match[2] && match[3]) nodes.push(<a key={key} href={match[3]} target="_blank" rel="noreferrer noopener nofollow" className="underline decoration-1 underline-offset-4">{match[2]}</a>);
    else if (match[4] || match[5]) nodes.push(<strong key={key}>{match[4] ?? match[5]}</strong>);
    else if (match[6] || match[7]) nodes.push(<em key={key}>{match[6] ?? match[7]}</em>);
    else if (match[8]) nodes.push(<code key={key} className="rounded bg-[#ededed] px-1.5 py-0.5 font-mono text-[.9em]">{match[8]}</code>);
    else if (match[9]) nodes.push(<del key={key}>{match[9]}</del>);
    else if (match[10]) nodes.push(<mark key={key} className="rounded-[3px] bg-[#eaeaea] px-0.5 text-inherit">{match[10]}</mark>);
    cursor = match.index + match[0].length;
  }
  if (cursor < value.length) nodes.push(value.slice(cursor));
  return nodes;
}

export function MarkdownPreview({ value, compact = false }: { value: string; compact?: boolean }) {
  const lines = value.split("\n");
  if (!value.trim()) return <p className="text-[#a1a1a1]">Biçimlendirilmiş ön izleme burada görünecek.</p>;

  return (
    <div className={`${compact ? "space-y-2 text-[14px] leading-6 text-[#5f5f5f]" : "space-y-4 text-[16px] leading-7 text-[#272727]"} break-words`}>
      {lines.map((line, index) => {
        const key = `line-${index}`;
        if (!line.trim()) return <div key={key} className="h-1" aria-hidden="true" />;
        if (line.startsWith("## ")) return <h2 key={key} className={`${compact ? "text-base" : "pt-2 text-2xl"} font-bold tracking-[-.035em] text-[#272727]`}>{renderInline(line.slice(3), key)}</h2>;
        if (line.startsWith("# ")) return <h1 key={key} className={`${compact ? "text-lg" : "pt-2 text-3xl"} font-bold tracking-[-.045em] text-[#171717]`}>{renderInline(line.slice(2), key)}</h1>;
        if (line.startsWith("> ")) return <blockquote key={key} className="border-l-2 border-black pl-4 italic text-[#5f5f5f]">{renderInline(line.slice(2), key)}</blockquote>;
        return <p key={key}>{renderInline(line, key)}</p>;
      })}
    </div>
  );
}
