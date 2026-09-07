import { ApiResponse } from "@/types/ApiResponse";
import { Tienda } from "@/types/Tienda";

const API_URL = "http://localhost:8080";

function obtenerToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("accessToken");
}

export async function obtenerTiendas(): Promise<
  ApiResponse<Tienda[]>
> {
  const token = obtenerToken();

  const respuesta = await fetch(
    `${API_URL}/tiendas?page=1&perPage=20`,
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