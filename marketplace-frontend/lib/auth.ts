"use client";

import { useSesion } from "@/components/auth/SesionProvider";

// Indica si hay un usuario logueado. No mira el nombre del rol: lo que cada
// usuario puede hacer se decide por permisos (ver lib/access.ts).
export function useHaySesion(): boolean | undefined {
  const { sesion, cargando, error } = useSesion();

  // Evita redirigir como si no hubiera sesión cuando
  // todavía se está verificando o hubo un fallo de conexión.
  if (cargando || error) return undefined;

  return sesion !== null;
}
