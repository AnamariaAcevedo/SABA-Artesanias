import { ApiResponse } from "@/types/ApiResponse";
import { Producto } from "@/types/Producto";

const API_URL = "http://localhost:8080";

function obtenerToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("accessToken");
}

export async function obtenerProductos(
  nombre?: string,
  idTienda?: number
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

  const token = obtenerToken();

  const respuesta = await fetch(
    `${API_URL}/productos?${parametros.toString()}`,
    {
      method: "GET",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    }
  );

  if (!respuesta.ok) {
    throw new Error(`Error ${respuesta.status}`);
  }

  return respuesta.json();
}