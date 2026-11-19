package com.marketplace.marketplace_backend.modules.producto;

import com.marketplace.marketplace_backend.modules.categoriasubcategoria.CategoriaSubcategoriaRepository;
import com.marketplace.marketplace_backend.modules.imagenproducto.ImagenProductoRepository;
import com.marketplace.marketplace_backend.modules.pedido.ProductoPedidoRepository;
import com.marketplace.marketplace_backend.modules.productosubcategoria.ProductoSubcategoriaRepository;
import com.marketplace.marketplace_backend.modules.tienda.Tienda;
import com.marketplace.marketplace_backend.modules.tienda.TiendaRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// Eliminar y desactivar un producto: no se puede mientras tenga pedidos pendientes.
class ProductoServiceImplTests {

    private final ProductoRepository productoRepository = mock(ProductoRepository.class);
    private final ProductoPedidoRepository productoPedidoRepository = mock(ProductoPedidoRepository.class);
    private final ProductoServiceImpl service = new ProductoServiceImpl(
            productoRepository,
            mock(TiendaRepository.class),
            mock(ProductoSubcategoriaRepository.class),
            mock(CategoriaSubcategoriaRepository.class),
            mock(ImagenProductoRepository.class),
            productoPedidoRepository);

    @Test
    void noEliminaUnProductoConPedidosPendientes() {
        Producto producto = producto();
        pendientes(1);

        IllegalStateException error = assertThrows(IllegalStateException.class, () -> service.delete(1L));

        assertEquals("No se puede eliminar el producto: está en 1 pedido pendiente. Confirmalo o cancelalo primero.",
                error.getMessage());
        assertEquals(null, producto.getDeletedAt());
        verify(productoRepository, never()).save(any());
    }

    @Test
    void eliminaUnProductoSinPedidosPendientes() {
        Producto producto = producto();
        pendientes(0);

        service.delete(1L);

        assertNotNull(producto.getDeletedAt());
        verify(productoRepository).save(producto);
    }

    @Test
    void noDesactivaUnProductoConPedidosPendientes() {
        Producto producto = producto();
        pendientes(2);

        IllegalStateException error = assertThrows(IllegalStateException.class, () -> service.cambiarActivo(1L, false));

        assertTrue(error.getMessage().contains("2 pedidos pendientes"));
        assertTrue(producto.getActivo());
        verify(productoRepository, never()).save(any());
    }

    @Test
    void desactivaUnProductoSinPedidosPendientes() {
        Producto producto = producto();
        pendientes(0);

        var respuesta = service.cambiarActivo(1L, false);

        assertFalse(producto.getActivo());
        assertFalse(respuesta.getActivo());
    }

    @Test
    void activarNoRevisaLosPedidos() {
        Producto producto = producto();
        producto.setActivo(false);
        pendientes(5);

        service.cambiarActivo(1L, true);

        assertTrue(producto.getActivo());
    }

    private Producto producto() {
        Tienda tienda = new Tienda();
        tienda.setId(9L);
        Producto producto = new Producto();
        producto.setId(1L);
        producto.setPrecio(1000.0);
        producto.setTienda(tienda);
        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto));
        when(productoRepository.save(producto)).thenReturn(producto);
        return producto;
    }

    private void pendientes(long cantidad) {
        when(productoPedidoRepository.countByProducto_IdAndPedido_EstadoIn(eq(1L), any())).thenReturn(cantidad);
    }
}
