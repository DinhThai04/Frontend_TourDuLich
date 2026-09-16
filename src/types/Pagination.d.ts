export interface IPageableMeta {
  pageNumber: number;
  pageSize: number;
  sort: unknown[];
  offset: number;
  unpaged: boolean;
  paged?: boolean;
}

export interface IPaginationResponse<T> {
  content: T[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number; // current page index (0-based)
  numberOfElements: number;
  pageable: IPageableMeta;
  size: number;
  sort: unknown[];
  totalElements: number;
  totalPages: number;
}
