import type { ReactNode } from 'react';

export default function AdminPageHeader({ title, description, actions }: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return <header className="admin-page-heading">
    <div><h1>{title}</h1>{description && <p>{description}</p>}</div>
    {actions && <div className="admin-page-actions">{actions}</div>}
  </header>;
}
