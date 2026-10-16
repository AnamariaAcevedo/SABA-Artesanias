import { apiFetch, apiFetchConPaginacion } from "@/lib/api";
import type { Pedido } from "@/types/pedido";

// Estados de un pedido (EstadoPedido del backend) y las transiciones que puede
// aplicar la tienda. CANCELADO solo se permite desde PENDIENTE o CONFIRMADO; al
// confirmar se descuenta el stock y al cancelar un confirmado se devuelve.

export type EstadoPedido = "PENDIENTE" | "CONFIRMADO" | "ENVIADO" | "ENTREGADO" | "CANCELADO";

export const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export const ORDEN_ESTADOS: EstadoPedido[] = ["PENDIENTE", "CONFIRMADO", "ENVIADO", "ENTREGADO"];

export type AccionTienda = "confirmar" | "enviar" | "entregar" | "cancelar";

export const ACCIONES_TIENDA: Record<AccionTienda, { etiqueta: string; enCurso: string; pregunta: string }> = {
  confirmar: {
    etiqueta: "Confirmar",
    enCurso: "Confirmando…",
    pregunta: "¿Confirmar el pedido N.º {numero}? Se va a descontar el stock de sus productos.",
  },
  enviar: { etiqueta: "Marcar enviado", enCurso: "Guardando…", pregunta: "¿Marcar el pedido N.º {numero} como enviado?" },
  entregar: { etiqueta: "Marcar entregado", enCurso: "Guardando…", pregunta: "¿Marcar el pedido N.º {numero} como entregado?" },
  cancelar: {
    etiqueta: "Cancelar",
    enCurso: "Cancelando…",
    pregunta: "¿Cancelar el pedido N.º {numero}? Si ya estaba confirmado, se devuelve el stock.",
  },
};

export function accionesDisponibles(estado: string): AccionTienda[] {
  switch (estado) {
    case "PENDIENTE":
      return ["confirmar", "cancelar"];
    case "CONFIRMADO":
      return ["enviar", "cancelar"];
    case "ENVIADO":
      return ["entregar"];
    default:
      return [];
  }
}

export function puedeCancelarCliente(estado: string): boolean {
  return estado === "PENDIENTE" || estado === "CONFIRMADO";
}

export function etiquetaEstado(estado: string): string {
  return ETIQUETA_ESTADO[estado as EstadoPedido] ?? estado;
}

export function formatearFechaHora(fechaIso: string | null): string {
  if (!fechaIso) return "—";
  return new Date(fechaIso).toLocaleString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ----------------------------------------------------------- Llamadas al API

// `numero` es opcional: si viene, busca ese número de pedido de la tienda.
export function listarPedidosTienda(page: number, perPage: number, numero?: number) {
  const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  if (numero) params.set("numero", String(numero));
  return apiFetchConPaginacion<Pedido[]>(`/mi-tienda/pedidos?${params.toString()}`);
}

// Sugerencias del buscador: pedidos de la tienda cuyo número empieza con `prefijo`.
export function sugerirPedidosTienda(prefijo: string): Promise<Pedido[]> {
  return apiFetch<Pedido[]>(`/mi-tienda/pedidos/sugerencias?numero=${encodeURIComponent(prefijo)}&limite=6`);
}

export function aplicarAccionTienda(id: number, accion: AccionTienda): Promise<Pedido> {
  return apiFetch<Pedido>(`/mi-tienda/pedidos/${id}/${accion}`, { method: "PUT" });
}

export function listarMisPedidos(page: number, perPage: number) {
  return apiFetchConPaginacion<Pedido[]>(`/pedidos/mios?page=${page}&perPage=${perPage}`);
}
