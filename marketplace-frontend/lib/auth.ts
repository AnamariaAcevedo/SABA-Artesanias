import { useSyncExternalStore } from "react";

// Roles que el backend usa para identificar a un administrador, tal como los
// interpreta el claim `rol` del JWT (ver app/login/page.tsx).
const ROLES_ADMIN = ["ADMIN", "ADMINISTRADOR", "ROLE_ADMIN", "ROLE_ADMINISTRADOR"];

function decodificarRol(token: string): string | null {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(payload));
    return typeof claims.rol === "string" ? claims.rol.trim().toUpperCase() : null;
  } catch {
    return null;
  }
}

function leerRolActual(): string | null {
  try {
    const token = localStorage.getItem("accessToken");
    return token ? decodificarRol(token) : null;
  } catch {
    return null;
  }
}

function suscribirseASesion(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function snapshotServidor(): undefined {
  return undefined;
}

// `undefined` = todavía no se pudo leer localStorage (SSR / primer paint de
// hidratación); `null` = ya se leyó y no hay sesión o rol válido.
export function useRolSesion(): string | null | undefined {
  return useSyncExternalStore(suscribirseASesion, leerRolActual, snapshotServidor);
}

export function esRolAdministrador(rol: string | null | undefined): boolean {
  return typeof rol === "string" && ROLES_ADMIN.includes(rol);
}
