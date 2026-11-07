// Formas de datos de publicaciones, alineadas con los DTOs del backend
// (PublicacionRequestDto / PublicacionResponseDto / ArchivoPublicacionResponseDto).

export interface Publicacion {
  id: number;
  titulo: string;
  contenido: string;
  idTienda: number;
  nombreTienda: string;
  cantidadReacciones: number;
  cantidadComentarios: number;
  // Si el usuario de la sesión ya reaccionó; siempre false para invitados.
  reaccionada: boolean;
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

export interface ComentarioPublicacion {
  id: number;
  contenido: string;
  idUsuario: number;
  nombreUsuario: string;
  createdAt: string;
}
