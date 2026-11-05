import { apiFetch } from "@/lib/api";
import type { Pedido, PedidoCreateInput } from "@/types/pedido";

const TIEMPO_MAXIMO_SUBIDA = 120000;

// POST /pedidos acepta invitados; con sesión, apiFetch agrega el token y el
// backend completa los datos de entrega con los de la cuenta.
export function crearPedido(pedido: PedidoCreateInput, comprobante: File): Promise<Pedido> {
  const datos = new FormData();
  datos.append("pedido", new Blob([JSON.stringify(pedido)], { type: "application/json" }));
  datos.append("comprobante", comprobante);
  return apiFetch<Pedido>("/pedidos", {
    method: "POST",
    body: datos,
    signal: AbortSignal.timeout(TIEMPO_MAXIMO_SUBIDA),
  });
}

// Solo para pedidos propios con sesión, en estado PENDIENTE o CONFIRMADO.
export function cancelarPedidoPropio(id: number): Promise<Pedido> {
  return apiFetch<Pedido>(`/pedidos/mios/${id}/cancelar`, { method: "PUT" });
}
