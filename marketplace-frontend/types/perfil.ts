// Formas de datos del perfil propio, alineadas con los DTOs del backend
// (PerfilResponseDto / PerfilUpdateRequestDto / PerfilActualizadoResponseDto).

export interface Perfil {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  usuario: string;
  telefono: string;
  // Desde cuándo puede volver a cambiar su nombre de usuario; null = ya puede.
  proximoCambioUsuario: string | null;
  calle: string;
  nombreEdificio: string | null;
  nroCasa: number | null;
  nroDepartamento: string | null;
  idBarrio: number;
  nombreBarrio: string;
  idCiudad: number;
  nombreCiudad: string;
  idDepartamento: number;
  nombreDepartamento: string;
  idPais: number;
  nombrePais: string;
}

export interface PerfilUpdateInput {
  nombre: string;
  apellido: string;
  email: string;
  usuario: string;
  telefono: string;
  calle: string;
  nombreEdificio: string | null;
  nroCasa: number | null;
  nroDepartamento: string | null;
  idBarrio?: number;
}

// Si cambió el nombre de usuario, el backend devuelve tokens nuevos.
export interface PerfilActualizado {
  perfil: Perfil;
  accessToken: string | null;
  refreshToken: string | null;
}

export function etiquetaDireccionPerfil(perfil: Perfil): string {
  return perfil.calle;
}

export function etiquetaNumeroPerfil(perfil: Perfil): string {
  if (perfil.nombreEdificio) {
    return `${perfil.nombreEdificio}${perfil.nroDepartamento ? `, depto. ${perfil.nroDepartamento}` : ""}`;
  }
  return perfil.nroCasa !== null ? String(perfil.nroCasa) : "";
}

export function etiquetaUbicacionPerfil(perfil: Perfil): string {
  return [perfil.nombreBarrio, perfil.nombreCiudad, perfil.nombreDepartamento, perfil.nombrePais].join(", ");
}

export function formatearFecha(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
}
