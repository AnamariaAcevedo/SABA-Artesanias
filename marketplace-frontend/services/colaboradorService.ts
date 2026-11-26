import { apiFetch } from "@/lib/api";
import type { Colaborador, UsuarioDisponible } from "@/types/colaborador";

// Equipo de la propia tienda. Solo el dueño puede usar estos endpoints.
export function listarColaboradores(): Promise<Colaborador[]> {
  return apiFetch<Colaborador[]>("/mi-tienda/colaboradores");
}

export function sugerirUsuariosDisponibles(texto: string): Promise<UsuarioDisponible[]> {
  return apiFetch<UsuarioDisponible[]>(
    `/mi-tienda/colaboradores/sugerencias?usuario=${encodeURIComponent(texto)}&limite=6`,
  );
}

export function agregarColaborador(usuario: string): Promise<Colaborador> {
  return apiFetch<Colaborador>("/mi-tienda/colaboradores", {
    method: "POST",
    body: JSON.stringify({ usuario }),
  });
}

export function quitarColaborador(id: number): Promise<void> {
  return apiFetch<void>(`/mi-tienda/colaboradores/${id}`, { method: "DELETE" });
}
