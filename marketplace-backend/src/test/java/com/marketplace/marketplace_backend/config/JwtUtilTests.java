package com.marketplace.marketplace_backend.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtUtilTests {

    private static final String CLAVE = "clave-de-prueba-de-al-menos-32-caracteres-para-hs256";

    private JwtUtil jwtUtil;
    private UserDetails usuario;

    @BeforeEach
    void configurar() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secretKey", CLAVE);
        ReflectionTestUtils.setField(jwtUtil, "tiempoExpiracion", 60L);
        ReflectionTestUtils.setField(jwtUtil, "tiempoExpiracionRefresh", 10080L);
        usuario = User.withUsername("vendedor").password("x").authorities(List.of()).build();
    }

    @Test
    void unAccessTokenAutenticaElRequest() {
        String access = jwtUtil.generateToken("vendedor", 1L, "Vendedor");

        assertTrue(jwtUtil.validateToken(access, usuario));
        assertTrue(jwtUtil.isAccessToken(access));
        assertFalse(jwtUtil.isRefreshToken(access));
    }

    @Test
    void unRefreshTokenNoSirveComoAccessToken() {
        String refresh = jwtUtil.generateRefreshToken("vendedor");

        assertFalse(jwtUtil.validateToken(refresh, usuario));
        assertTrue(jwtUtil.isRefreshToken(refresh));
        assertFalse(jwtUtil.isAccessToken(refresh));
    }

    @Test
    void unTokenSinTipoEmitidoAntesDelCambioSeRechaza() {
        String tokenAnterior = Jwts.builder()
                .subject("vendedor")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(Keys.hmacShaKeyFor(CLAVE.getBytes()))
                .compact();

        assertFalse(jwtUtil.validateToken(tokenAnterior, usuario));
    }

    @Test
    void elTipoSeLeeAunqueElAccessTokenEsteVencido() {
        ReflectionTestUtils.setField(jwtUtil, "tiempoExpiracion", -1L);
        String vencido = jwtUtil.generateToken("vendedor", 1L, "Vendedor");

        assertTrue(jwtUtil.isAccessToken(vencido));
        assertFalse(jwtUtil.validateToken(vencido, usuario));
    }
}
