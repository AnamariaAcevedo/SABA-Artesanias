package com.marketplace.marketplace_backend.modules.auth;

import com.marketplace.marketplace_backend.config.JwtUtil;
import com.marketplace.marketplace_backend.modules.barrio.BarrioRepository;
import com.marketplace.marketplace_backend.modules.direccion.DireccionRepository;
import com.marketplace.marketplace_backend.modules.refreshtoken.RefreshTokenService;
import com.marketplace.marketplace_backend.modules.rol.RolRepository;
import com.marketplace.marketplace_backend.modules.tiendausuario.TiendaUsuarioRepository;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthServiceImplTests {

    @Test
    void rechazaLaRenovacionCuandoElRefreshTokenNoTieneFirmaValida() {
        JwtUtil jwtUtil = mock(JwtUtil.class);
        when(jwtUtil.isSignedByUs("refresh-invalido")).thenReturn(false);

        AuthServiceImpl service = new AuthServiceImpl(
                mock(AuthenticationManager.class),
                jwtUtil,
                mock(RefreshTokenService.class),
                mock(UsuarioRepository.class),
                mock(RolRepository.class),
                mock(DireccionRepository.class),
                mock(BarrioRepository.class),
                mock(PasswordEncoder.class),
                mock(TiendaUsuarioRepository.class)
        );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.generateRefreshToken("refresh-invalido", "access")
        );

        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatusCode());
        assertEquals("Refresh token inválido", error.getReason());
    }
}
