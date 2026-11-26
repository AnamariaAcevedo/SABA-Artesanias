package com.marketplace.marketplace_backend.modules.dashboard;

import com.marketplace.marketplace_backend.modules.pedido.PedidoRepository;
import com.marketplace.marketplace_backend.modules.producto.ProductoRepository;
import com.marketplace.marketplace_backend.modules.solicitudvendedor.SolicitudVendedorRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DashboardServiceTests {

    private final PedidoRepository pedidoRepository = mock(PedidoRepository.class);
    private final DashboardService service = new DashboardService(
            pedidoRepository,
            mock(ProductoRepository.class),
            mock(SolicitudVendedorRepository.class)
    );

    @Test
    void completaConCeroLosDiasSinVentas() {
        when(pedidoRepository.findAllByOrderByFechaPedidoDesc(any(Pageable.class))).thenReturn(Page.empty());

        var resumen = service.obtenerResumen(7);

        assertEquals(7, resumen.periodoDias());
        assertEquals(7, resumen.ventasDiarias().size());
        assertEquals(0, resumen.ventasDiarias().stream().mapToDouble(item -> item.total()).sum());
        assertEquals(0, resumen.ticketPromedio());
    }

    @Test
    void limitaElPeriodoAUnMaximoDeNoventaDias() {
        when(pedidoRepository.findAllByOrderByFechaPedidoDesc(any(Pageable.class))).thenReturn(Page.empty());

        var resumen = service.obtenerResumen(365);

        assertEquals(90, resumen.periodoDias());
        assertEquals(90, resumen.ventasDiarias().size());
    }
}
