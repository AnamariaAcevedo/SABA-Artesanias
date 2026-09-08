// Formas de respuesta compartidas con el backend (StandardResponseDto / Pagination).

export interface Pagination {
  page: number;
  perPage: number;
  total: number;
}

export interface StandardResponse<T> {
  success: boolean;
  data: T;
  errors: string[] | null;
  pagination: Pagination | null;
}
