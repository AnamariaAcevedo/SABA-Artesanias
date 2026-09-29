"use client";

import { useSesion } from "@/components/auth/SesionProvider";

const ROLES_ADMIN = [
  "ADMIN",
  "ADMINISTRADOR",
  "ROLE_ADMIN",
  "ROLE_ADMINISTRADOR",
];

export function useRolSesion(): string | null | undefined {
  const { sesion, cargando, error } = useSesion();

  // Evita redirigir como si no hubiera sesión cuando
  // todavía se está verificando o hubo un fallo de conexión.
  if (cargando || error) return undefined;

  return sesion?.rol.trim().toUpperCase() ?? null;
}

export function esRolAdministrador(
    rol: string | null | undefined
): boolean {
  return typeof rol === "string" && ROLES_ADMIN.includes(rol);
}