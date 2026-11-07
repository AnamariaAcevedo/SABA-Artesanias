package com.marketplace.marketplace_backend.modules.reaccion;

import com.marketplace.marketplace_backend.modules.comentario.Comentario;
import com.marketplace.marketplace_backend.modules.comentario.ComentarioRepository;
import com.marketplace.marketplace_backend.modules.comentario.ComentarioServiceImpl;
import com.marketplace.marketplace_backend.modules.comentario.dto.ComentarioRequestDto;
import com.marketplace.marketplace_backend.modules.publicacion.Publicacion;
import com.marketplace.marketplace_backend.modules.publicacion.PublicacionRepository;
import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InteraccionesPublicacionTests {

    private final ReaccionRepository reaccionRepository = mock(ReaccionRepository.class);
    private final ComentarioRepository comentarioRepository = mock(ComentarioRepository.class);
    private final PublicacionRepository publicacionRepository = mock(PublicacionRepository.class);
    private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);

    private final ReaccionServiceImpl reacciones =
            new ReaccionServiceImpl(reaccionRepository, publicacionRepository, usuarioRepository);
    private final ComentarioServiceImpl comentarios =
            new ComentarioServiceImpl(comentarioRepository, publicacionRepository, usuarioRepository);

    private final Usuario usuario = new Usuario();

    @BeforeEach
    void iniciarSesion() {
        usuario.setId(7L);
        usuario.setNombre("Ana");
        usuario.setApellido("Pérez");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("cliente", null, List.of())
        );
        when(usuarioRepository.findByUsuarioIgnoreCase("cliente")).thenReturn(Optional.of(usuario));
    }

    @AfterEach
    void limpiarContextoDeSeguridad() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void reaccionarGuardaYDevuelveElTotal() {
        when(publicacionRepository.findById(5L)).thenReturn(Optional.of(vigente()));
        when(reaccionRepository.countByPublicacion_Id(5L)).thenReturn(3L);

        assertEquals(3L, reacciones.crear(5L));
        verify(reaccionRepository).save(any(Reaccion.class));
    }

    @Test
    void reaccionarDosVecesNoSumaOtraReaccion() {
        when(publicacionRepository.findById(5L)).thenReturn(Optional.of(vigente()));
        when(reaccionRepository.existsByPublicacion_IdAndUsuario_Id(5L, 7L)).thenReturn(true);
        when(reaccionRepository.countByPublicacion_Id(5L)).thenReturn(1L);

        assertEquals(1L, reacciones.crear(5L));
        verify(reaccionRepository, never()).save(any());
    }

    @Test
    void quitarSoloBorraLaReaccionDelUsuarioAutenticado() {
        when(publicacionRepository.findById(5L)).thenReturn(Optional.of(vigente()));
        when(reaccionRepository.countByPublicacion_Id(5L)).thenReturn(0L);

        assertEquals(0L, reacciones.quitar(5L));
        verify(reaccionRepository).borrarDeUsuario(5L, 7L);
    }

    @Test
    void noSePuedeReaccionarAUnaPublicacionVencida() {
        when(publicacionRepository.findById(5L)).thenReturn(Optional.of(vencida()));

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> reacciones.crear(5L));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
        verify(reaccionRepository, never()).save(any());
    }

    @Test
    void comentarGuardaElTextoSinEspaciosSobrantes() {
        Publicacion publicacion = vigente();
        when(publicacionRepository.findById(5L)).thenReturn(Optional.of(publicacion));
        when(comentarioRepository.save(any(Comentario.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        var creado = comentarios.crear(5L, new ComentarioRequestDto("  Hermoso  "));

        assertEquals("Hermoso", creado.getContenido());
        assertEquals("Ana Pérez", creado.getNombreUsuario());
    }

    @Test
    void noSePuedeComentarUnaPublicacionVencida() {
        when(publicacionRepository.findById(5L)).thenReturn(Optional.of(vencida()));

        assertThrows(ResponseStatusException.class, () -> comentarios.crear(5L, new ComentarioRequestDto("Hola")));

        verify(comentarioRepository, never()).save(any());
    }

    @Test
    void losComentariosDeUnaVencidaNoSeVenAlPublico() {
        when(publicacionRepository.findById(5L)).thenReturn(Optional.of(vencida()));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> comentarios.listarPorPublicacion(5L, 1, 10)
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }

    @Test
    void nadieMasPuedeBorrarUnComentarioAjeno() {
        Usuario autor = new Usuario();
        autor.setId(99L);
        Comentario comentario = new Comentario();
        comentario.setUsuario(autor);
        when(comentarioRepository.findById(3L)).thenReturn(Optional.of(comentario));

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> comentarios.eliminarPropio(3L));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(comentarioRepository, never()).save(any());
    }

    private static Publicacion vigente() {
        Publicacion publicacion = new Publicacion();
        publicacion.setId(5L);
        publicacion.setFechaExpiracion(LocalDateTime.now().plusDays(1));
        return publicacion;
    }

    private static Publicacion vencida() {
        Publicacion publicacion = vigente();
        publicacion.setFechaExpiracion(LocalDateTime.now().minusMinutes(1));
        return publicacion;
    }
}
