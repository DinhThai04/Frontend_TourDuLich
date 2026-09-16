export interface Permission {
  id: number;
  name: string;
  apiPath: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  module: string;
  roles: Role[];
}
