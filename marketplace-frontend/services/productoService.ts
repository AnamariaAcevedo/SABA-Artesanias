import { ApiResponse } from "@/types/ApiResponse";
import { Producto } from "@/types/Producto";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function obtenerProductos(
  nombre?: string,
  idTienda?: number,
  idCategoria?: number,
  idSubcategoria?: number
): Promise<ApiResponse<Producto[]>> {
  const parametros = new URLSearchParams();

  parametros.set("page", "1");
  parametros.set("perPage", "20");

  if (nombre?.trim()) {
    parametros.set("nombre", nombre.trim());
  }

  if (idTienda) {
    parametros.set("idTienda", idTienda.toString());
  }

  if (idCategoria) {
    parametros.set(
      "idCategoria",
      idCategoria.toString()
    );
  }

  if (idSubcategoria) {
    parametros.set(
      "idSubcategoria",
      idSubcategoria.toString()
    );
  }

  const respuesta = await fetch(
    `${API_URL}/productos?${parametros.toString()}`
  );

  if (!respuesta.ok) {
    throw new Error(`Error ${respuesta.status}`);
  }

  return respuesta.json();
}

export async function obtenerProductoPorId(
  id: number
): Promise<ApiResponse<Producto>> {
  const respuesta = await fetch(
    `${API_URL}/productos/${id}`
  );

  if (!respuesta.ok) {
    throw new Error(`Error ${respuesta.status}`);
  }

  return respuesta.json();
}