package com.marketplace.marketplace_backend.modules.pedido;

import com.marketplace.marketplace_backend.modules.barrio.Barrio;
import com.marketplace.marketplace_backend.modules.barrio.BarrioRepository;
import com.marketplace.marketplace_backend.modules.cupon.CuponRepository;
import com.marketplace.marketplace_backend.modules.pedido.dto.PedidoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.pedido.dto.PedidoItemRequestDto;
import com.marketplace.marketplace_backend.modules.pedido.dto.PedidoResponseDto;
import com.marketplace.marketplace_backend.modules.producto.Producto;
import com.marketplace.marketplace_backend.modules.producto.ProductoRepository;
import com.marketplace.marketplace_backend.modules.tienda.Tienda;
import com.marketplace.marketplace_backend.modules.tienda.TiendaRepository;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class PedidoServiceImplTests {

    private static final byte[] PDF = {'%', 'P', 'D', 'F', '-', '1', '.', '7'};

    private final PedidoRepository pedidoRepository = mock(PedidoRepository.class);
    private final ProductoPedidoRepository productoPedidoRepository = mock(ProductoPedidoRepository.class);
    private final ComprobantePedidoRepository comprobanteRepository = mock(ComprobantePedidoRepository.class);
    private final TiendaRepository tiendaRepository = mock(TiendaRepository.class);
    private final ProductoRepository productoRepository = mock(ProductoRepository.class);
    private final BarrioRepository barrioRepository = mock(BarrioRepository.class);

    private final PedidoServiceImpl service = new PedidoServiceImpl(
            pedidoRepository,
            productoPedidoRepository,
            comprobanteRepository,
            mock(UsuarioRepository.class),
            tiendaRepository,
            productoRepository,
            barrioRepository,
            mock(CuponRepository.class),
            mock(JavaMailSender.class),
            "tienda@example.com"
    );

    @Test
    void guardaElComprobanteConElTipoDetectadoEnElContenido() {
        prepararCompraDeInvitado();
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        // Declara ser una imagen, pero el contenido es un PDF: manda el contenido.
        MockMultipartFile archivo = new MockMultipartFile("comprobante", "pago.png", "image/png", PDF);

        service.crear(pedidoDeInvitado(), archivo);

        ArgumentCaptor<ComprobantePedido> guardado = ArgumentCaptor.forClass(ComprobantePedido.class);
        verify(comprobanteRepository).save(guardado.capture());
        assertEquals("application/pdf", guardado.getValue().getContentType());
        assertArrayEquals(PDF, guardado.getValue().getArchivo());
    }

    @Test
    void creaElPedidoPendienteConSuComprobante() {
        prepararCompraDeInvitado();
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        PedidoResponseDto creado = service.crear(
                pedidoDeInvitado(),
                new MockMultipartFile("comprobante", "pago.pdf", "application/pdf", PDF)
        );

        assertEquals("PENDIENTE", creado.getEstado());
    }

    @Test
    void sinComprobanteNoSeCreaElPedido() {
        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.crear(pedidoDeInvitado(), null)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals("El comprobante de pago es obligatorio", error.getReason());
        verifyNoInteractions(tiendaRepository, pedidoRepository, comprobanteRepository);
    }

    @Test
    void unaTiendaSinDatosDeCuentaNoRecibePedidos() {
        Tienda tienda = new Tienda();
        tienda.setNombre("Tienda nueva");
        when(tiendaRepository.findByIdParaActualizar(1L)).thenReturn(Optional.of(tienda));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.crear(
                        pedidoDeInvitado(),
                        new MockMultipartFile("comprobante", "pago.pdf", "application/pdf", PDF)
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verifyNoInteractions(pedidoRepository, comprobanteRepository);
    }

    @Test
    void rechazaUnArchivoNoPermitidoAntesDeCrearElPedido() {
        MockMultipartFile html = new MockMultipartFile(
                "comprobante", "pago.png", "image/png", "<script>alert(1)</script>".getBytes()
        );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.crear(pedidoDeInvitado(), html)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verifyNoInteractions(tiendaRepository, pedidoRepository, comprobanteRepository);
    }

    @Test
    void rechazaUnComprobanteDeMasDeCincoMegas() {
        byte[] contenido = new byte[5 * 1024 * 1024 + 1];
        System.arraycopy(PDF, 0, contenido, 0, PDF.length);
        MockMultipartFile grande = new MockMultipartFile("comprobante", "pago.pdf", "application/pdf", contenido);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.crear(pedidoDeInvitado(), grande)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verifyNoInteractions(pedidoRepository);
    }

    @Test
    void laTiendaObtieneElComprobanteDeSuPedido() {
        Pedido pedido = new Pedido();
        pedido.setId(5L);
        ComprobantePedido comprobante = new ComprobantePedido();
        when(pedidoRepository.findByIdAndTienda_Id(5L, 1L)).thenReturn(Optional.of(pedido));
        when(comprobanteRepository.findByPedido_Id(5L)).thenReturn(Optional.of(comprobante));

        assertSame(comprobante, service.obtenerComprobanteDeTienda(1L, 5L));
    }

    @Test
    void otraTiendaNoPuedeVerElComprobante() {
        when(pedidoRepository.findByIdAndTienda_Id(5L, 2L)).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.obtenerComprobanteDeTienda(2L, 5L)
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
        verifyNoInteractions(comprobanteRepository);
    }

    @Test
    void informaCuandoElPedidoNoTieneComprobante() {
        Pedido pedido = new Pedido();
        pedido.setId(5L);
        when(pedidoRepository.findByIdAndTienda_Id(5L, 1L)).thenReturn(Optional.of(pedido));
        when(comprobanteRepository.findByPedido_Id(5L)).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.obtenerComprobanteDeTienda(1L, 5L)
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
        assertEquals("Este pedido no tiene comprobante", error.getReason());
    }

    @Test
    void administracionPuedeFiltrarLosPedidosPorTienda() {
        when(pedidoRepository.findByTienda_IdOrderByIdDesc(eq(7L), any(Pageable.class)))
                .thenReturn(Page.empty());

        service.listarTodos(7L, 1, 10);

        verify(pedidoRepository).findByTienda_IdOrderByIdDesc(eq(7L), any(Pageable.class));
    }

    @Test
    void rechazaUnProductoDesactivado() {
        prepararCompraDeInvitado();
        Producto desactivado = mock(Producto.class);
        when(desactivado.getActivo()).thenReturn(false);
        when(desactivado.getNombre()).thenReturn("Mantel");
        when(productoRepository.findById(2L)).thenReturn(Optional.of(desactivado));
        MockMultipartFile archivo = new MockMultipartFile("comprobante", "pago.pdf", "application/pdf", PDF);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.crear(pedidoDeInvitado(), archivo));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals("El producto Mantel ya no está a la venta. Quitalo del carrito para continuar.", error.getReason());
    }

    @Test
    void rechazaUnPedidoAUnaTiendaDesactivada() {
        prepararCompraDeInvitado();
        Tienda desactivada = mock(Tienda.class);
        when(desactivada.getActivo()).thenReturn(false);
        when(desactivada.getNombre()).thenReturn("Cueros del Sur");
        when(tiendaRepository.findByIdParaActualizar(1L)).thenReturn(Optional.of(desactivada));
        MockMultipartFile archivo = new MockMultipartFile("comprobante", "pago.pdf", "application/pdf", PDF);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.crear(pedidoDeInvitado(), archivo));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals("Cueros del Sur no está recibiendo pedidos por ahora. Quitá sus productos del carrito para continuar.",
                error.getReason());
    }

    @Test
    void alCancelarUnPedidoConfirmadoDevuelveElStockAunqueElProductoYaNoEste() {
        Tienda tienda = new Tienda();
        tienda.setId(1L);
        Pedido pedido = new Pedido();
        pedido.setId(10L);
        pedido.setTienda(tienda);
        pedido.setBarrio(new Barrio());
        pedido.setEstado(EstadoPedido.CONFIRMADO);
        when(pedidoRepository.findByIdAndTienda_Id(10L, 1L)).thenReturn(Optional.of(pedido));
        when(pedidoRepository.save(pedido)).thenReturn(pedido);

        // El producto pudo eliminarse: solo se usa su id, que no lo carga.
        Producto producto = new Producto();
        producto.setId(2L);
        ProductoPedido linea = new ProductoPedido();
        linea.setProducto(producto);
        linea.setNombreProducto("Mantel");
        linea.setCantidad(3);
        when(productoPedidoRepository.findByPedido_IdOrderByIdAsc(10L)).thenReturn(List.of(linea));

        PedidoResponseDto cancelado = service.cancelarDeTienda(1L, 10L);

        verify(productoRepository).devolverStock(2L, 3);
        assertEquals("CANCELADO", cancelado.getEstado());
        assertEquals("Mantel", cancelado.getItems().get(0).getNombreProducto());
    }

    private void prepararCompraDeInvitado() {
        Tienda tienda = mock(Tienda.class);
        when(tienda.getId()).thenReturn(1L);
        when(tienda.getNombre()).thenReturn("Tienda");
        when(tienda.tieneDatosDePago()).thenReturn(true);
        // Un mock devuelve false para un Boolean: hay que indicar que estan activos.
        when(tienda.getActivo()).thenReturn(true);
        when(tiendaRepository.findByIdParaActualizar(1L)).thenReturn(Optional.of(tienda));

        Barrio barrio = mock(Barrio.class);
        when(barrio.getId()).thenReturn(3L);
        when(barrioRepository.findById(3L)).thenReturn(Optional.of(barrio));

        Producto producto = mock(Producto.class);
        when(producto.getTienda()).thenReturn(tienda);
        when(producto.getActivo()).thenReturn(true);
        when(producto.getCantidadDisponible()).thenReturn(10);
        when(producto.getPrecio()).thenReturn(1000.0);
        when(productoRepository.findById(2L)).thenReturn(Optional.of(producto));
    }

    private static PedidoCreateRequestDto pedidoDeInvitado() {
        PedidoCreateRequestDto pedido = new PedidoCreateRequestDto();
        pedido.setIdTienda(1L);
        pedido.setItems(List.of(new PedidoItemRequestDto(2L, 1)));
        pedido.setNombreReceptor("Cliente");
        pedido.setTelefonoReceptor("0981123456");
        pedido.setEmailReceptor("cliente@example.com");
        pedido.setIdBarrio(3L);
        pedido.setDireccion("Calle 1");
        return pedido;
    }
}
