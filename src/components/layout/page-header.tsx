export function PageHeader({ title, note, actions }: { title: string; note: string; actions?: React.ReactNode }) {
  return <header className="page-header"><div><h1 className="page-title">{title}</h1><p className="page-note">{note}</p></div>{actions}</header>;
}
