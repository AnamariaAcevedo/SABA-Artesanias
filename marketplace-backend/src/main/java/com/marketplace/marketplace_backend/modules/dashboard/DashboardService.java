package com.marketplace.marketplace_backend.modules.dashboard;

import com.marketplace.marketplace_backend.modules.dashboard.dto.DashboardResumenDto;
import com.marketplace.marketplace_backend.modules.dashboard.dto.PedidoRecienteDto;
import com.marketplace.marketplace_backend.modules.dashboard.dto.ResumenTiendaDto;
import com.marketplace.marketplace_backend.modules.dashboard.dto.VentaDiariaDto;
import com.marketplace.marketplace_backend.modules.pedido.EstadoPedido;
import com.marketplace.marketplace_backend.modules.pedido.PedidoRepository;
import com.marketplace.marketplace_backend.modules.producto.ProductoRepository;
import com.marketplace.marketplace_backend.modules.solicitudvendedor.EstadoSolicitudVendedor;
import com.marketplace.marketplace_backend.modules.solicitudvendedor.SolicitudVendedorRepository;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@AllArgsConstructor
public class DashboardService {

    private static final int STOCK_BAJO = 5;
    private static final List<EstadoPedido> ESTADOS_VENTA = List.of(
            EstadoPedido.CONFIRMADO,
            EstadoPedido.ENVIADO,
            EstadoPedido.ENTREGADO
    );

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final SolicitudVendedorRepository solicitudVendedorRepository;

    @Transactional(readOnly = true)
    public DashboardResumenDto obtenerResumen(int periodoSolicitado) {
        int periodoDias = Math.min(Math.max(periodoSolicitado, 7), 90);
        LocalDate hoy = LocalDate.now();
        LocalDate desdeFecha = hoy.minusDays(periodoDias - 1L);
        LocalDateTime desde = desdeFecha.atStartOfDay();
        LocalDateTime hasta = hoy.plusDays(1).atStartOfDay();
        LocalDateTime inicioMes = hoy.withDayOfMonth(1).atStartOfDay();
        LocalDateTime inicioHoy = hoy.atStartOfDay();

        long pedidosPeriodo = pedidoRepository
                .countByEstadoInAndFechaPedidoGreaterThanEqualAndFechaPedidoLessThan(ESTADOS_VENTA, desde, hasta);
        double ventasPeriodo = valor(pedidoRepository.sumarVentas(ESTADOS_VENTA, desde, hasta));

        Map<LocalDate, PedidoRepository.VentaDiariaProjection> ventasPorFecha = pedidoRepository
                .resumirVentasDiarias(desde, hasta)
                .stream()
                .collect(Collectors.toMap(PedidoRepository.VentaDiariaProjection::getFecha, item -> item));

        List<VentaDiariaDto> ventasDiarias = IntStream.range(0, periodoDias)
                .mapToObj(desplazamiento -> desdeFecha.plusDays(desplazamiento))
                .map(fecha -> {
                    var venta = ventasPorFecha.get(fecha);
                    return venta == null
                            ? new VentaDiariaDto(fecha, 0, 0)
                            : new VentaDiariaDto(fecha, venta.getPedidos(), valor(venta.getTotal()));
                })
                .toList();

        List<ResumenTiendaDto> tiendas = pedidoRepository.resumirTiendas(desde, hasta).stream()
                .map(item -> new ResumenTiendaDto(
                        item.getIdTienda(),
                        item.getNombreTienda(),
                        item.getPedidos(),
                        valor(item.getTotalVendido()),
                        item.getPendientes()
                ))
                .toList();

        List<PedidoRecienteDto> pedidosRecientes = pedidoRepository
                .findAllByOrderByFechaPedidoDesc(PageRequest.of(0, 5))
                .getContent()
                .stream()
                .map(pedido -> new PedidoRecienteDto(
                        pedido.getId(),
                        pedido.getNumero(),
                        pedido.getTienda().getId(),
                        pedido.getTienda().getNombre(),
                        pedido.getNombreReceptor(),
                        pedido.getTotal(),
                        pedido.getEstado().name(),
                        pedido.getFechaPedido()
                ))
                .toList();

        return new DashboardResumenDto(
                periodoDias,
                desdeFecha,
                hoy,
                pedidoRepository.countByEstado(EstadoPedido.PENDIENTE),
                pedidosPeriodo,
                pedidoRepository.countByEstadoAndFechaPedidoGreaterThanEqualAndFechaPedidoLessThan(
                        EstadoPedido.ENTREGADO, desde, hasta),
                pedidoRepository.countByEstadoAndFechaPedidoGreaterThanEqualAndFechaPedidoLessThan(
                        EstadoPedido.CANCELADO, desde, hasta),
                valor(pedidoRepository.sumarVentas(ESTADOS_VENTA, inicioHoy, hasta)),
                valor(pedidoRepository.sumarVentas(ESTADOS_VENTA, inicioMes, hasta)),
                ventasPeriodo,
                pedidosPeriodo == 0 ? 0 : ventasPeriodo / pedidosPeriodo,
                productoRepository.countByCantidadDisponibleLessThanEqual(STOCK_BAJO),
                solicitudVendedorRepository.countByEstado(EstadoSolicitudVendedor.PENDIENTE),
                ventasDiarias,
                tiendas,
                pedidosRecientes
        );
    }

    private static double valor(Double numero) {
        return numero == null ? 0 : numero;
    }
}
