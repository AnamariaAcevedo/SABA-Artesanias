import { apiFetch } from "@/lib/api";
import type { Pedido, PedidoCreateInput } from "@/types/pedido";

// POST /pedidos acepta invitados; con sesión, apiFetch agrega el token y el
// backend completa los datos de entrega con los de la cuenta.
export function crearPedido(pedido: PedidoCreateInput): Promise<Pedido> {
  return apiFetch<Pedido>("/pedidos", {
    method: "POST",
    body: JSON.stringify(pedido),
  });
}

// Solo para pedidos propios con sesión, en estado PENDIENTE o CONFIRMADO.
export function cancelarPedidoPropio(id: number): Promise<Pedido> {
  return apiFetch<Pedido>(`/pedidos/mios/${id}/cancelar`, { method: "PUT" });
}
