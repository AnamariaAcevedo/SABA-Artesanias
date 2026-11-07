import { apiFetch, apiFetchConPaginacion } from "@/lib/api";
import type { ArchivoPublicacion, Publicacion, PublicacionInput } from "@/types/Publicacion";

const TIEMPO_MAXIMO_SUBIDA = 120000;

export function urlFotoPublicacion(idArchivo: number): string {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080").replace(/\/+$/, "");
  return `${apiUrl}/archivos-publicacion/${idArchivo}`;
}

// Canal público: solo publicaciones vigentes. Sin `idTienda` trae las de todas las tiendas.
export function listarPublicaciones(page: number, perPage: number, idTienda?: number) {
  const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  if (idTienda !== undefined) params.set("idTienda", String(idTienda));
  return apiFetchConPaginacion<Publicacion[]>(`/publicaciones?${params.toString()}`);
}

// ---------------------------------------------------- Gestión desde Mi tienda

export function listarMisPublicaciones(page: number, perPage: number) {
  return apiFetchConPaginacion<Publicacion[]>(`/mi-tienda/publicaciones?page=${page}&perPage=${perPage}`);
}

export function obtenerMiPublicacion(id: string): Promise<Publicacion> {
  return apiFetch<Publicacion>(`/mi-tienda/publicaciones/${id}`);
}

export function crearPublicacion(datos: PublicacionInput): Promise<Publicacion> {
  return apiFetch<Publicacion>("/mi-tienda/publicaciones", { method: "POST", body: JSON.stringify(datos) });
}

export function actualizarPublicacion(id: number, datos: PublicacionInput): Promise<Publicacion> {
  return apiFetch<Publicacion>(`/mi-tienda/publicaciones/${id}`, { method: "PUT", body: JSON.stringify(datos) });
}

export function eliminarPublicacion(id: number): Promise<void> {
  return apiFetch<void>(`/mi-tienda/publicaciones/${id}`, { method: "DELETE" });
}

export function subirFotoPublicacion(id: number, archivo: File): Promise<ArchivoPublicacion> {
  const datos = new FormData();
  datos.append("archivo", archivo);
  return apiFetch<ArchivoPublicacion>(`/mi-tienda/publicaciones/${id}/archivos`, {
    method: "POST",
    body: datos,
    signal: AbortSignal.timeout(TIEMPO_MAXIMO_SUBIDA),
  });
}

export function quitarFotoPublicacion(id: number, idArchivo: number): Promise<void> {
  return apiFetch<void>(`/mi-tienda/publicaciones/${id}/archivos/${idArchivo}`, { method: "DELETE" });
}
