interface Role {
  id: number;
  name: string;
  active?: boolean;
  description?: string | null;
  permissions: import('./Permission').Permission[];
}
