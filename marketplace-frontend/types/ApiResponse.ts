export interface Pagination {
  page: number;
  perPage: number;
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  errors: string[] | null;
  pagination?: Pagination;
}