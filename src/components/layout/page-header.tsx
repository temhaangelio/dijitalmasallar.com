export function PageHeader({ title, note, actions }: { title: string; note?: React.ReactNode; actions?: React.ReactNode }) {
  return <header className="page-header"><div><h1 className="page-title">{title}</h1>{note ? <p className="page-note">{note}</p> : null}</div>{actions}</header>;
}
