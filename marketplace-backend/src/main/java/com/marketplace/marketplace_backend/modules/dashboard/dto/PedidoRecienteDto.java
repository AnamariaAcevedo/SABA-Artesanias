package com.marketplace.marketplace_backend.modules.dashboard.dto;

import java.time.LocalDateTime;

public record PedidoRecienteDto(
        Long id,
        Integer numero,
        Long idTienda,
        String nombreTienda,
        String nombreReceptor,
        double total,
        String estado,
        LocalDateTime fechaPedido
) {
}
