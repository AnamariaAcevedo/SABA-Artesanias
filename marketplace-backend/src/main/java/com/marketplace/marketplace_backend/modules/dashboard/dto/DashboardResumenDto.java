package com.marketplace.marketplace_backend.modules.dashboard.dto;

import java.time.LocalDate;
import java.util.List;

public record DashboardResumenDto(
        int periodoDias,
        LocalDate desde,
        LocalDate hasta,
        long pedidosPendientes,
        long pedidosPeriodo,
        long pedidosEntregadosPeriodo,
        long pedidosCanceladosPeriodo,
        double ventasHoy,
        double ventasMes,
        double ventasPeriodo,
        double ticketPromedio,
        long productosStockBajo,
        long solicitudesVendedorPendientes,
        List<VentaDiariaDto> ventasDiarias,
        List<ResumenTiendaDto> tiendas,
        List<PedidoRecienteDto> pedidosRecientes
) {
}
