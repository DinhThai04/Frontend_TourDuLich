import type { ReactNode } from 'react';

export function AdminStatus({ tone = 'neutral', children }: {
  tone?: 'success' | 'warning' | 'danger' | 'attention' | 'info' | 'neutral';
  children: ReactNode;
}) {
  return <span className="admin-status" data-tone={tone}>{children}</span>;
}
