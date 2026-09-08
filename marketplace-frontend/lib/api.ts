import type { StandardResponse } from "@/types/api";

// Cliente HTTP mínimo compartido por las pantallas de administración: arma la
// URL contra el backend, agrega el token de sesión y normaliza los errores en
// mensajes legibles, siguiendo el mismo patrón usado en /login y /registro.

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getApiUrl(): string {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    (process.env.NODE_ENV === "development" ? "http://localhost:8080" : "");
  if (!apiUrl) throw new ApiError("El servidor no está disponible en este momento.", 0);
  return apiUrl.replace(/\/$/, "");
}

function obtenerToken(): string | null {
  try {
    return localStorage.getItem("accessToken");
  } catch {
    return null;
  }
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<StandardResponse<T>> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = obtenerToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(15000),
    });
  } catch (cause) {
    if (cause instanceof ApiError) throw cause;
    throw new ApiError("No pudimos conectar con el servidor. Intentá nuevamente.", 0);
  }

  const resultado = (await response.json().catch(() => null)) as StandardResponse<T> | null;

  if (response.status === 401 || response.status === 403) {
    throw new ApiError("No tenés permiso para realizar esta acción.", response.status);
  }
  if (response.status === 404) {
    throw new ApiError("No encontramos el recurso solicitado.", response.status);
  }
  if (response.status === 429) {
    throw new ApiError("Demasiados intentos. Esperá un momento e intentá nuevamente.", response.status);
  }
  if (!response.ok || resultado?.success !== true) {
    const mensajes = resultado?.errors?.filter((mensaje): mensaje is string => typeof mensaje === "string") ?? [];
    throw new ApiError(
      mensajes.join(" ") || "No pudimos completar la operación. Intentá nuevamente en unos momentos.",
      response.status,
    );
  }

  return resultado;
}

// Para endpoints que devuelven un único recurso o nada (create/update/get/delete).
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const resultado = await apiRequest<T>(path, init);
  return resultado.data;
}

// Para endpoints de listado, que además informan la paginación.
export async function apiFetchConPaginacion<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T; pagination: StandardResponse<T>["pagination"] }> {
  const resultado = await apiRequest<T>(path, init);
  return { data: resultado.data, pagination: resultado.pagination };
}
