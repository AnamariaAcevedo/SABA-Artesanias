package com.marketplace.marketplace_backend.modules.pedido;

// Estados de un pedido. CANCELADO solo puede llegar desde PENDIENTE o CONFIRMADO.
public enum EstadoPedido {
    PENDIENTE,
    CONFIRMADO,
    ENVIADO,
    ENTREGADO,
    CANCELADO
}
