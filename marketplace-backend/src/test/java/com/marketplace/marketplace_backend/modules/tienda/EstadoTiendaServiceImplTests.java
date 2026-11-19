package com.marketplace.marketplace_backend.modules.tienda;

import com.marketplace.marketplace_backend.modules.archivopublicacion.ArchivoPublicacionRepository;
import com.marketplace.marketplace_backend.modules.contacto.ContactoRepository;
import com.marketplace.marketplace_backend.modules.cupon.CuponRepository;
import com.marketplace.marketplace_backend.modules.pedido.EstadoPedido;
import com.marketplace.marketplace_backend.modules.pedido.PedidoRepository;
import com.marketplace.marketplace_backend.modules.producto.ProductoRepository;
import com.marketplace.marketplace_backend.modules.publicacion.PublicacionRepository;
import com.marketplace.marketplace_backend.modules.rol.Rol;
import com.marketplace.marketplace_backend.modules.rol.RolRepository;
import com.marketplace.marketplace_backend.modules.tiendausuario.TiendaUsuario;
import com.marketplace.marketplace_backend.modules.tiendausuario.TiendaUsuarioRepository;
import com.marketplace.marketplace_backend.modules.tiendausuario.TipoVinculoTienda;
import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// Desactivar y eliminar tiendas.
class EstadoTiendaServiceImplTests {

    private final TiendaRepository tiendaRepository = mock(TiendaRepository.class);
    private final PedidoRepository pedidoRepository = mock(PedidoRepository.class);
    private final ProductoRepository productoRepository = mock(ProductoRepository.class);
    private final TiendaUsuarioRepository tiendaUsuarioRepository = mock(TiendaUsuarioRepository.class);
    private final RolRepository rolRepository = mock(RolRepository.class);
    private final EstadoTiendaServiceImpl service = new EstadoTiendaServiceImpl(
            tiendaRepository,
            mock(TiendaService.class),
            pedidoRepository,
            productoRepository,
            mock(ContactoRepository.class),
            mock(CuponRepository.class),
            mock(PublicacionRepository.class),
            mock(ArchivoPublicacionRepository.class),
            tiendaUsuarioRepository,
            mock(UsuarioRepository.class),
            rolRepository);

    @Test
    void noDesactivaUnaTiendaConPedidosPendientes() {
        Tienda tienda = tienda();
        when(pedidoRepository.countByTienda_IdAndEstado(1L, EstadoPedido.PENDIENTE)).thenReturn(2L);

        IllegalStateException error = assertThrows(IllegalStateException.class, () -> service.cambiarActivo(1L, false));

        assertEquals("No se puede desactivar la tienda: tiene 2 pedidos pendientes. Confirmalos o cancelalos primero.",
                error.getMessage());
        assertTrue(tienda.getActivo());
        verify(tiendaRepository, never()).save(any());
    }

    @Test
    void desactivaUnaTiendaSinPedidosPendientes() {
        Tienda tienda = tienda();

        service.cambiarActivo(1L, false);

        assertFalse(tienda.getActivo());
        verify(tiendaRepository).save(tienda);
    }

    @Test
    void noEliminaUnaTiendaConProductosOPedidos() {
        Tienda tienda = tienda();
        when(productoRepository.countByTienda_Id(1L)).thenReturn(4L);
        when(pedidoRepository.countByTienda_Id(1L)).thenReturn(3L);

        IllegalStateException error = assertThrows(IllegalStateException.class, () -> service.eliminar(1L));

        assertEquals("No se puede eliminar la tienda: tiene 4 productos y 3 pedidos. Desactivala en lugar de eliminarla.",
                error.getMessage());
        assertNull(tienda.getDeletedAt());
    }

    @Test
    void alEliminarUnaTiendaVaciaSuEquipoVuelveACliente() {
        Tienda tienda = tienda();
        Rol cliente = rol("Cliente");
        when(rolRepository.findByNombreAndDeletedAtIsNull("Cliente")).thenReturn(Optional.of(cliente));
        TiendaUsuario dueno = vinculo(rol("VendedorPrincipal"), TipoVinculoTienda.PRINCIPAL);
        TiendaUsuario colaborador = vinculo(rol("VendedorSecundario"), TipoVinculoTienda.SECUNDARIO);
        when(tiendaUsuarioRepository.listarEquipoDeTienda(1L)).thenReturn(List.of(dueno, colaborador));

        service.eliminar(1L);

        assertNotNull(tienda.getDeletedAt());
        assertNotNull(dueno.getDeletedAt());
        assertNotNull(colaborador.getDeletedAt());
        assertEquals(cliente, dueno.getUsuario().getRol());
        assertEquals(cliente, colaborador.getUsuario().getRol());
    }

    @Test
    void alEliminarUnaTiendaSeRespetaOtroRolQueLeDioUnAdministrador() {
        tienda();
        Rol especial = rol("Promotor");
        TiendaUsuario vinculo = vinculo(especial, TipoVinculoTienda.SECUNDARIO);
        when(tiendaUsuarioRepository.listarEquipoDeTienda(1L)).thenReturn(List.of(vinculo));

        service.eliminar(1L);

        assertEquals(especial, vinculo.getUsuario().getRol());
        assertNotNull(vinculo.getDeletedAt());
    }

    private Tienda tienda() {
        Tienda tienda = new Tienda();
        tienda.setId(1L);
        when(tiendaRepository.findById(1L)).thenReturn(Optional.of(tienda));
        return tienda;
    }

    private static Rol rol(String nombre) {
        Rol rol = new Rol();
        rol.setNombre(nombre);
        return rol;
    }

    private static TiendaUsuario vinculo(Rol rol, TipoVinculoTienda tipo) {
        Usuario usuario = new Usuario();
        usuario.setRol(rol);
        TiendaUsuario vinculo = new TiendaUsuario();
        vinculo.setUsuario(usuario);
        vinculo.setTipo(tipo);
        return vinculo;
    }
}
