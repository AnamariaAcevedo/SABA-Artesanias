package com.marketplace.marketplace_backend.config;

import com.marketplace.marketplace_backend.modules.usuario.UsuarioDetailsService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JwtRequestFilterTests {

    @AfterEach
    void limpiarContexto() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void unTokenDeUnUsuarioEliminadoContinuaComoSesionNoAutenticada() throws Exception {
        JwtUtil jwtUtil = mock(JwtUtil.class);
        UsuarioDetailsService usuarioDetailsService = mock(UsuarioDetailsService.class);
        JwtRequestFilter filter = new JwtRequestFilter(jwtUtil, usuarioDetailsService);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/me");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        request.addHeader("Authorization", "Bearer token-anterior");

        when(jwtUtil.extractUsuario("token-anterior")).thenReturn("paraacevedo");
        when(usuarioDetailsService.loadUserByUsername("paraacevedo"))
                .thenThrow(new UsernameNotFoundException("Usuario no encontrado: paraacevedo"));

        assertDoesNotThrow(() -> filter.doFilter(request, response, chain));

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(chain).doFilter(request, response);
    }
}
