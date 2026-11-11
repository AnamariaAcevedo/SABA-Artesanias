// Formas de datos de cupones, alineadas con los DTOs del backend
// (CuponResponseDto / CuponRequestDto / CuponPreviewResponseDto).

export interface Cupon {
  id: number;
  nombre: string;
  codigo: string;
  porcentaje: number;
  fechaInicio: string;
  fechaFin: string;
  idTienda: number;
  nombreTienda: string;
  cantidadUsos: number;
}

export interface CuponInput {
  nombre: string;
  codigo: string;
  porcentaje: number;
  fechaInicio: string;
  fechaFin: string;
}

export interface CuponPreview {
  codigo: string;
  nombre: string;
  porcentaje: number;
}

export interface CuponPublico {
  id: number;
  nombre: string;
  codigo: string;
  porcentaje: number;
  idTienda: number;
  nombreTienda: string;
}
