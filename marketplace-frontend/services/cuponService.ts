import { apiFetch, apiFetchConPaginacion } from "@/lib/api";
import type { Cupon, CuponInput, CuponPreview, CuponPublico } from "@/types/cupon";

export function validarCupon(idTienda: number, codigo: string): Promise<CuponPreview> {
  return apiFetch<CuponPreview>(
    `/tiendas/${idTienda}/cupones/validar?codigo=${encodeURIComponent(codigo)}`,
  );
}

// Catalogo publico: cupones vigentes de todas las tiendas.
export function listarCuponesPublicos(page: number, perPage: number) {
  return apiFetchConPaginacion<CuponPublico[]>(`/cupones?page=${page}&perPage=${perPage}`);
}

export function listarCupones(page: number, perPage: number) {
  return apiFetchConPaginacion<Cupon[]>(`/mi-tienda/cupones?page=${page}&perPage=${perPage}`);
}

export function crearCupon(datos: CuponInput): Promise<Cupon> {
  return apiFetch<Cupon>("/mi-tienda/cupones", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export function eliminarCupon(id: number): Promise<void> {
  return apiFetch<void>(`/mi-tienda/cupones/${id}`, { method: "DELETE" });
}
