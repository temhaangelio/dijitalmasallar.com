export function analyticsChangeLabel(value: number | null) {
  if (value === null) return "önceki dönemde veri yok";
  const rounded = Math.abs(value) < 0.05 ? 0 : value;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}%${Math.abs(rounded).toFixed(1).replace(/\.0$/, "").replace(".", ",")} önceki döneme göre`;
}

/** Sum page views only: unique visitors must never be summed across days. */
export function analyticsChartRows(rows: { date: string; pageviews: number }[], monthly: boolean) {
  if (!monthly) return rows.map(({ date, pageviews }) => ({ date, pageviews }));
  const months = new Map<string, number>();
  for (const row of rows) {
    const month = row.date.slice(0, 7);
    months.set(month, (months.get(month) ?? 0) + row.pageviews);
  }
  return [...months].map(([month, pageviews]) => ({ date: `${month}-01`, pageviews }));
}
