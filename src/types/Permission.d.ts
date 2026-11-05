export interface Permission {
  id: number;
  /** Mã ổn định dùng để phân quyền (PERM:<code> trong JWT). */
  code: string;
  /** Nhãn hiển thị, đổi được mà không ảnh hưởng quyền đã cấp. */
  name: string;
  apiPath: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  module: string;
  roles: Role[];
}

export type PermissionInput = {
  id?: number;
  /** Chỉ gửi khi tạo mới; backend giữ mã cố định sau khi phát hành. */
  code?: string;
  name: string;
  apiPath: string;
  method: Permission['method'];
  module: string;
  roleIds?: number[];
};
export type PermissionFormValues = Omit<PermissionInput, 'id' | 'roleIds'> & { roles?: number[] };
