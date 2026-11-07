package com.marketplace.marketplace_backend.modules.mitienda;

import com.marketplace.marketplace_backend.modules.comentario.Comentario;
import com.marketplace.marketplace_backend.modules.comentario.ComentarioRepository;
import com.marketplace.marketplace_backend.modules.comentario.ComentarioService;
import com.marketplace.marketplace_backend.modules.comentario.ComentarioServiceImpl;
import com.marketplace.marketplace_backend.modules.publicacion.Publicacion;
import com.marketplace.marketplace_backend.modules.publicacion.PublicacionRepository;
import com.marketplace.marketplace_backend.modules.tienda.Tienda;
import com.marketplace.marketplace_backend.modules.tiendausuario.TiendaUsuario;
import com.marketplace.marketplace_backend.modules.tiendausuario.TiendaUsuarioRepository;
import com.marketplace.marketplace_backend.modules.tiendausuario.TipoVinculoTienda;
import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ModeracionComentariosTests {

    private static final long MI_TIENDA = 1L;
    private static final long OTRA_TIENDA = 2L;

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private TiendaUsuarioRepository tiendaUsuarioRepository;
    @Mock private PublicacionRepository publicacionRepository;
    @Mock private ComentarioService comentarioService;

    @InjectMocks private MiTiendaServiceImpl service;

    @BeforeEach
    void iniciarSesion() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("vendedor", null, List.of())
        );
        vincularComo(TipoVinculoTienda.PRINCIPAL);
    }

    @AfterEach
    void limpiarContextoDeSeguridad() {
        SecurityContextHolder.clearContext();
    }

    @ParameterizedTest
    @EnumSource(TipoVinculoTienda.class)
    void elDuenoYElColaboradorBorranComentariosDeSusPublicaciones(TipoVinculoTienda tipo) {
        vincularComo(tipo);
        when(publicacionRepository.findById(5L)).thenReturn(Optional.of(publicacionDe(MI_TIENDA)));

        service.eliminarComentarioPublicacion(5L, 3L);

        verify(comentarioService).eliminarDePublicacion(5L, 3L);
    }

    @Test
    void otraTiendaNoPuedeBorrarComentarios() {
        when(publicacionRepository.findById(5L)).thenReturn(Optional.of(publicacionDe(OTRA_TIENDA)));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.eliminarComentarioPublicacion(5L, 3L)
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
        verifyNoInteractions(comentarioService);
    }

    @Test
    void unComentarioDeOtraPublicacionNoSeBorra() {
        ComentarioRepository comentarioRepository = mock(ComentarioRepository.class);
        ComentarioServiceImpl comentarios = new ComentarioServiceImpl(comentarioRepository, publicacionRepository, usuarioRepository);
        when(comentarioRepository.findByIdAndPublicacion_Id(3L, 5L)).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> comentarios.eliminarDePublicacion(5L, 3L)
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
        verify(comentarioRepository, never()).save(any());
    }

    @Test
    void laModeracionHaceBorradoLogico() {
        ComentarioRepository comentarioRepository = mock(ComentarioRepository.class);
        ComentarioServiceImpl comentarios = new ComentarioServiceImpl(comentarioRepository, publicacionRepository, usuarioRepository);
        Comentario comentario = new Comentario();
        when(comentarioRepository.findByIdAndPublicacion_Id(3L, 5L)).thenReturn(Optional.of(comentario));

        comentarios.eliminarDePublicacion(5L, 3L);

        assertNotNull(comentario.getDeletedAt());
        verify(comentarioRepository).save(comentario);
    }

    private void vincularComo(TipoVinculoTienda tipo) {
        Usuario usuario = new Usuario();
        usuario.setId(7L);
        TiendaUsuario vinculo = new TiendaUsuario();
        vinculo.setTienda(tienda(MI_TIENDA));
        vinculo.setTipo(tipo);
        when(usuarioRepository.findByUsuarioIgnoreCase("vendedor")).thenReturn(Optional.of(usuario));
        when(tiendaUsuarioRepository.findFirstByUsuario_Id(7L)).thenReturn(Optional.of(vinculo));
    }

    private static Publicacion publicacionDe(long idTienda) {
        Publicacion publicacion = new Publicacion();
        publicacion.setId(5L);
        publicacion.setTienda(tienda(idTienda));
        return publicacion;
    }

    private static Tienda tienda(long id) {
        Tienda tienda = new Tienda();
        tienda.setId(id);
        return tienda;
    }
}
