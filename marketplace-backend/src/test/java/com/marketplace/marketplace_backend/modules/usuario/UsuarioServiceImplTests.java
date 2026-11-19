package com.marketplace.marketplace_backend.modules.usuario;

import com.marketplace.marketplace_backend.modules.barrio.BarrioRepository;
import com.marketplace.marketplace_backend.modules.comentario.ComentarioRepository;
import com.marketplace.marketplace_backend.modules.direccion.Direccion;
import com.marketplace.marketplace_backend.modules.direccion.DireccionRepository;
import com.marketplace.marketplace_backend.modules.pedido.PedidoRepository;
import com.marketplace.marketplace_backend.modules.reaccion.ReaccionRepository;
import com.marketplace.marketplace_backend.modules.recuperacion.TokenRecuperacionRepository;
import com.marketplace.marketplace_backend.modules.refreshtoken.RefreshTokenRepository;
import com.marketplace.marketplace_backend.modules.rol.Rol;
import com.marketplace.marketplace_backend.modules.rol.RolRepository;
import com.marketplace.marketplace_backend.modules.solicitudvendedor.SolicitudVendedorRepository;
import com.marketplace.marketplace_backend.modules.tiendausuario.TiendaUsuario;
import com.marketplace.marketplace_backend.modules.tiendausuario.TiendaUsuarioRepository;
import com.marketplace.marketplace_backend.modules.tiendausuario.TipoVinculoTienda;
import com.marketplace.marketplace_backend.modules.usuario.dto.UsuarioUpdateRequestDto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// Eliminar usuarios (solo sin actividad y nunca la propia cuenta) y el efecto de
// cambiarle el rol a un colaborador desde el panel.
class UsuarioServiceImplTests {

    private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
    private final RolRepository rolRepository = mock(RolRepository.class);
    private final TiendaUsuarioRepository tiendaUsuarioRepository = mock(TiendaUsuarioRepository.class);
    private final PedidoRepository pedidoRepository = mock(PedidoRepository.class);
    private final RefreshTokenRepository refreshTokenRepository = mock(RefreshTokenRepository.class);
    private final UsuarioServiceImpl service = new UsuarioServiceImpl(
            usuarioRepository,
            rolRepository,
            tiendaUsuarioRepository,
            pedidoRepository,
            mock(ComentarioRepository.class),
            mock(ReaccionRepository.class),
            mock(SolicitudVendedorRepository.class),
            refreshTokenRepository,
            mock(TokenRecuperacionRepository.class),
            mock(DireccionRepository.class),
            mock(BarrioRepository.class),
            mock(PasswordEncoder.class));

    @BeforeEach
    void iniciarSesionComoAdministrador() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("administrador", null, List.of()));
    }

    @AfterEach
    void cerrarSesion() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void noEliminaLaPropiaCuenta() {
        Usuario yo = usuario(1L, "Administrador");
        yo.setUsuario("Administrador");

        IllegalStateException error = assertThrows(IllegalStateException.class, () -> service.delete(1L));

        assertEquals("No podés eliminar tu propia cuenta.", error.getMessage());
        assertNull(yo.getDeletedAt());
    }

    @Test
    void noEliminaUnUsuarioConActividad() {
        Usuario usuario = usuario(7L, "Cliente");
        when(pedidoRepository.existsByUsuario_Id(7L)).thenReturn(true);

        IllegalStateException error = assertThrows(IllegalStateException.class, () -> service.delete(7L));

        assertEquals("Este usuario tiene actividad registrada (pedidos, tienda, comentarios, reacciones o solicitudes). "
                + "Desactivalo en lugar de eliminarlo.", error.getMessage());
        assertNull(usuario.getDeletedAt());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void eliminaUnUsuarioSinActividadYCierraSusSesiones() {
        Usuario usuario = usuario(7L, "Cliente");

        service.delete(7L);

        assertNotNull(usuario.getDeletedAt());
        verify(refreshTokenRepository).deleteByUsuario_Id(7L);
    }

    @Test
    void alCambiarleElRolAUnColaboradorDejaDeSerlo() {
        Usuario usuario = usuario(7L, "VendedorSecundario");
        TiendaUsuario vinculo = vinculo(usuario, TipoVinculoTienda.SECUNDARIO);
        Rol cliente = rolConId(3L, "Cliente");

        service.update(7L, cambioDeRol(3L));

        assertNotNull(vinculo.getDeletedAt());
        assertEquals(cliente, usuario.getRol());
    }

    @Test
    void alCambiarleElRolAlDuenoNoSeTocaSuTienda() {
        Usuario usuario = usuario(7L, "VendedorPrincipal");
        TiendaUsuario vinculo = vinculo(usuario, TipoVinculoTienda.PRINCIPAL);
        rolConId(3L, "Cliente");

        service.update(7L, cambioDeRol(3L));

        assertNull(vinculo.getDeletedAt());
    }

    private Usuario usuario(Long id, String nombreRol) {
        Rol rol = new Rol();
        rol.setNombre(nombreRol);
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setUsuario("usuario" + id);
        usuario.setRol(rol);
        usuario.setDireccion(new Direccion());
        when(usuarioRepository.findById(id)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(usuario)).thenReturn(usuario);
        return usuario;
    }

    private Rol rolConId(Long id, String nombre) {
        Rol rol = new Rol();
        rol.setId(id);
        rol.setNombre(nombre);
        when(rolRepository.findById(id)).thenReturn(Optional.of(rol));
        return rol;
    }

    private TiendaUsuario vinculo(Usuario usuario, TipoVinculoTienda tipo) {
        TiendaUsuario vinculo = new TiendaUsuario();
        vinculo.setUsuario(usuario);
        vinculo.setTipo(tipo);
        when(tiendaUsuarioRepository.findFirstByUsuario_Id(usuario.getId())).thenReturn(Optional.of(vinculo));
        return vinculo;
    }

    private static UsuarioUpdateRequestDto cambioDeRol(Long idRol) {
        UsuarioUpdateRequestDto request = new UsuarioUpdateRequestDto();
        request.setIdRol(idRol);
        return request;
    }
}
