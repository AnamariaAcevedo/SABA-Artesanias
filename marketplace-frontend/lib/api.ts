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

function obtenerRefreshToken(): string | null {
  try {
    return localStorage.getItem("refreshToken");
  } catch {
    return null;
  }
}

function limpiarSesionLocal() {
  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.dispatchEvent(new Event("sesion-cambiada"));
  } catch {
    // La respuesta 401 igualmente se informa aunque Storage no esté disponible.
  }
}

type TokensRenovados = {
  accessToken: string;
  refreshToken: string;
};

let renovacionEnCurso: Promise<string> | null = null;

async function renovarAccessToken(accessTokenVencido: string): Promise<string> {
  const accessTokenActual = obtenerToken();
  if (accessTokenActual && accessTokenActual !== accessTokenVencido) return accessTokenActual;

  if (!renovacionEnCurso) {
    renovacionEnCurso = (async () => {
      const refreshToken = obtenerRefreshToken();
      if (!refreshToken) throw new ApiError("Tu sesión venció. Iniciá sesión nuevamente.", 401);

      const response = await fetch(`${getApiUrl()}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: accessTokenVencido, refreshToken }),
        signal: AbortSignal.timeout(15000),
      });
      const resultado = (await response.json().catch(() => null)) as StandardResponse<TokensRenovados> | null;
      const tokens = resultado?.data;

      if (!response.ok || resultado?.success !== true || !tokens?.accessToken || !tokens.refreshToken) {
        const mensajes = resultado?.errors?.filter((mensaje): mensaje is string => typeof mensaje === "string") ?? [];
        const status = response.status >= 400 && response.status < 500 ? 401 : response.status;
        throw new ApiError(
          mensajes.join(" ") || (status === 401
            ? "Tu sesión venció. Iniciá sesión nuevamente."
            : "No pudimos renovar tu sesión. Intentá nuevamente."),
          status,
        );
      }

      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
      return tokens.accessToken;
    })().finally(() => {
      renovacionEnCurso = null;
    });
  }

  return renovacionEnCurso;
}

async function enviar(path: string, init: RequestInit, token: string | null): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(15000),
  });
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<StandardResponse<T>> {
  const tokenUsado = obtenerToken();
  let response: Response;
  try {
    response = await enviar(path, init, tokenUsado);

    if (response.status === 401 && tokenUsado && obtenerRefreshToken() && path !== "/refresh") {
      const tokenRenovado = await renovarAccessToken(tokenUsado);
      response = await enviar(path, init, tokenRenovado);
    }
  } catch (cause) {
    if (cause instanceof ApiError) {
      if (cause.status === 401) limpiarSesionLocal();
      throw cause;
    }
    throw new ApiError("No pudimos conectar con el servidor. Intentá nuevamente.", 0);
  }

  const resultado = (await response.json().catch(() => null)) as StandardResponse<T> | null;

  const mensajes = resultado?.errors?.filter((mensaje): mensaje is string => typeof mensaje === "string") ?? [];

  if (response.status === 401) {
    limpiarSesionLocal();
    throw new ApiError(
      mensajes.join(" ") || "Tu sesión venció o ya no es válida. Iniciá sesión nuevamente.",
      response.status,
    );
  }
  if (response.status === 403) {
    throw new ApiError(mensajes.join(" ") || "No tenés permiso para realizar esta acción.", response.status);
  }
  if (response.status === 404) {
    throw new ApiError(mensajes.join(" ") || "No encontramos el recurso solicitado.", response.status);
  }
  if (response.status === 429) {
    throw new ApiError(
      mensajes.join(" ") || "Demasiados intentos. Esperá un momento e intentá nuevamente.",
      response.status,
    );
  }
  if (!response.ok || resultado?.success !== true) {
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
