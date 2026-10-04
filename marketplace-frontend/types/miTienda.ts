// Formas de datos de la gestión de la propia tienda, alineadas con los DTOs del
// backend (MiTiendaResponseDto / MiTiendaUpdateRequestDto / MiProductoRequestDto /
// MiContactoRequestDto / ContactoResponseDto / ImagenProductoResponseDto).

export type VinculoTienda = "PRINCIPAL" | "SECUNDARIO";

export interface MiTienda {
  id: number;
  nombre: string;
  descripcion: string;
  tipoVinculo: VinculoTienda;
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

export interface MiTiendaUpdateInput {
  nombre: string;
  descripcion: string;
  calle: string;
  nombreEdificio: string | null;
  nroCasa: number | null;
  nroDepartamento: string | null;
  idBarrio?: number;
}

export interface MiProductoInput {
  nombre: string;
  descripcion: string;
  precio: number;
  descuento: number;
  cantidadDisponible: number;
  idsSubcategorias: number[];
}

export interface ImagenProducto {
  id: number;
  contentType: string;
  idProducto: number;
}

export interface TipoContacto {
  id: number;
  nombre: string;
}

export interface Contacto {
  id: number;
  enlace: string;
  usuario: string;
  nroTelefono: string | null;
  idTipoContacto: number;
  nombreTipoContacto: string;
  idTienda: number;
  nombreTienda: string;
}

export interface MiContactoInput {
  enlace: string;
  usuario: string;
  nroTelefono: string | null;
  idTipoContacto: number;
}

export function urlImagen(idImagen: number): string {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080").replace(/\/+$/, "");
  return `${apiUrl}/imagenes/${idImagen}`;
}

export function ubicacionTienda(tienda: MiTienda): string {
  return [tienda.nombreBarrio, tienda.nombreCiudad, tienda.nombreDepartamento, tienda.nombrePais].join(", ");
}
