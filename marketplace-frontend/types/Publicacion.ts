// Formas de datos de publicaciones, alineadas con los DTOs del backend
// (PublicacionRequestDto / PublicacionResponseDto / ArchivoPublicacionResponseDto).

export interface Publicacion {
  id: number;
  titulo: string;
  contenido: string;
  idTienda: number;
  nombreTienda: string;
  idsArchivos: number[];
  // Null solo en publicaciones anteriores a que existiera el vencimiento.
  fechaExpiracion: string | null;
  vigente: boolean;
  createdAt: string;
}

export interface PublicacionInput {
  titulo: string;
  contenido: string;
  // Obligatorio al crear; al editar, si no viene se mantiene el vencimiento actual.
  duracionDias?: number;
}

export interface ArchivoPublicacion {
  id: number;
}
