export function PageHeader({ title, note, actions }: { title: string; note?: React.ReactNode; actions?: React.ReactNode }) {
  return <header className="page-header"><div className="min-w-0"><h1 className="page-title">{title}</h1>{note ? <p className="page-note">{note}</p> : null}</div>{actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}</header>;
}
