import { ApiResponse } from "@/types/ApiResponse";
import { Categoria } from "@/types/Categoria";
import { Subcategoria } from "@/types/Subcategoria";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080").replace(/\/+$/, "");

export async function obtenerCategorias(): Promise<
  ApiResponse<Categoria[]>
> {
  const respuesta = await fetch(
    `${API_URL}/categorias?page=1&perPage=100`
  );

  if (!respuesta.ok) {
    throw new Error(`Error ${respuesta.status}`);
  }

  return respuesta.json();
}

export async function obtenerSubcategoriasPorCategoria(
  categoriaId: number
): Promise<ApiResponse<Subcategoria[]>> {
  const respuesta = await fetch(
    `${API_URL}/categorias/${categoriaId}/subcategorias?page=1&perPage=100`
  );

  if (!respuesta.ok) {
    throw new Error(`Error ${respuesta.status}`);
  }

  return respuesta.json();
}
