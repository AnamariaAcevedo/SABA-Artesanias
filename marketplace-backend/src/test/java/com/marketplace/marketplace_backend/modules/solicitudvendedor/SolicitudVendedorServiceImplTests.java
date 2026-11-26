package com.marketplace.marketplace_backend.modules.solicitudvendedor;

import com.marketplace.marketplace_backend.modules.barrio.BarrioRepository;
import com.marketplace.marketplace_backend.modules.contacto.ContactoRepository;
import com.marketplace.marketplace_backend.modules.direccion.DireccionRepository;
import com.marketplace.marketplace_backend.modules.rol.RolRepository;
import com.marketplace.marketplace_backend.modules.tienda.TiendaRepository;
import com.marketplace.marketplace_backend.modules.tiendausuario.TiendaUsuarioRepository;
import com.marketplace.marketplace_backend.modules.tipocontacto.TipoContactoRepository;
import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import com.marketplace.marketplace_backend.modules.solicitudvendedor.dto.SolicitudVendedorRequestDto;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SolicitudVendedorServiceImplTests {

    @AfterEach
    void limpiarContextoDeSeguridad() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void obtenerMiaRespondeNotFoundCuandoElUsuarioTodaviaNoTieneSolicitud() {
        SolicitudVendedorRepository solicitudRepository = mock(SolicitudVendedorRepository.class);
        UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
        Usuario usuario = mock(Usuario.class);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("cliente", "")
        );
        when(usuarioRepository.findByUsuarioIgnoreCase("cliente")).thenReturn(Optional.of(usuario));
        when(usuario.getId()).thenReturn(7L);
        when(solicitudRepository.findFirstByUsuario_IdOrderByIdDesc(7L)).thenReturn(Optional.empty());

        SolicitudVendedorServiceImpl service = crearService(solicitudRepository, usuarioRepository, mock(TiendaUsuarioRepository.class));

        ResponseStatusException error = assertThrows(ResponseStatusException.class, service::obtenerMia);

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
        assertEquals("No tenés ninguna solicitud", error.getReason());
    }

    @Test
    void noPermiteCrearOtraSolicitudDespuesDeUnRechazo() {
        SolicitudVendedorRepository solicitudRepository = mock(SolicitudVendedorRepository.class);
        UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
        TiendaUsuarioRepository tiendaUsuarioRepository = mock(TiendaUsuarioRepository.class);
        autenticar(usuarioRepository, 7L);

        when(tiendaUsuarioRepository.existsByUsuario_Id(7L)).thenReturn(false);
        when(solicitudRepository.existsByUsuario_IdAndEstado(7L, EstadoSolicitudVendedor.PENDIENTE)).thenReturn(false);
        when(solicitudRepository.existsByUsuario_IdAndEstado(7L, EstadoSolicitudVendedor.RECHAZADA)).thenReturn(true);

        SolicitudVendedorServiceImpl service = crearService(solicitudRepository, usuarioRepository, tiendaUsuarioRepository);
        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.crear(mock(SolicitudVendedorRequestDto.class))
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(solicitudRepository, never()).save(any());
    }

    @Test
    void permiteEliminarLaSolicitudDuranteLasPrimerasVeinticuatroHoras() {
        SolicitudVendedorRepository solicitudRepository = mock(SolicitudVendedorRepository.class);
        UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
        autenticar(usuarioRepository, 7L);
        SolicitudVendedor pendiente = new SolicitudVendedor();
        pendiente.setCreatedAt(LocalDateTime.now().minusHours(23).minusMinutes(59));

        when(solicitudRepository.findFirstByUsuario_IdAndEstado(7L, EstadoSolicitudVendedor.PENDIENTE))
                .thenReturn(Optional.of(pendiente));

        crearService(solicitudRepository, usuarioRepository, mock(TiendaUsuarioRepository.class)).eliminarMia();

        assertNotNull(pendiente.getDeletedAt());
        verify(solicitudRepository).save(pendiente);
    }

    @Test
    void noPermiteEliminarLaSolicitudDespuesDeVeinticuatroHoras() {
        SolicitudVendedorRepository solicitudRepository = mock(SolicitudVendedorRepository.class);
        UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
        autenticar(usuarioRepository, 7L);
        SolicitudVendedor pendiente = new SolicitudVendedor();
        pendiente.setCreatedAt(LocalDateTime.now().minusHours(24).minusSeconds(1));

        when(solicitudRepository.findFirstByUsuario_IdAndEstado(7L, EstadoSolicitudVendedor.PENDIENTE))
                .thenReturn(Optional.of(pendiente));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> crearService(solicitudRepository, usuarioRepository, mock(TiendaUsuarioRepository.class)).eliminarMia()
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(solicitudRepository, never()).save(any());
    }

    private Usuario autenticar(UsuarioRepository usuarioRepository, Long idUsuario) {
        Usuario usuario = mock(Usuario.class);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("cliente", "")
        );
        when(usuarioRepository.findByUsuarioIgnoreCase("cliente")).thenReturn(Optional.of(usuario));
        when(usuario.getId()).thenReturn(idUsuario);
        return usuario;
    }

    private SolicitudVendedorServiceImpl crearService(
            SolicitudVendedorRepository solicitudRepository,
            UsuarioRepository usuarioRepository,
            TiendaUsuarioRepository tiendaUsuarioRepository
    ) {
        return new SolicitudVendedorServiceImpl(
                solicitudRepository,
                usuarioRepository,
                mock(BarrioRepository.class),
                mock(DireccionRepository.class),
                mock(TiendaRepository.class),
                tiendaUsuarioRepository,
                mock(ContactoRepository.class),
                mock(TipoContactoRepository.class),
                mock(RolRepository.class)
        );
    }
}
