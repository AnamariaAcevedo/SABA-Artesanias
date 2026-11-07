package com.marketplace.marketplace_backend.modules.dashboard.dto;

public record ResumenTiendaDto(
        Long idTienda,
        String nombreTienda,
        long pedidos,
        double totalVendido,
        long pendientes
) {
}
