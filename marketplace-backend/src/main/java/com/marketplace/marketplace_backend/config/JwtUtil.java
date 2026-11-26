package com.marketplace.marketplace_backend.config;

import javax.crypto.SecretKey;
import java.util.Date;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.security.Keys;

@Component
// Genera y valida los JWT de acceso y refresh
public class JwtUtil {

    static final String CLAIM_TIPO = "typ";
    static final String TIPO_ACCESS = "access";
    static final String TIPO_REFRESH = "refresh";

    @Value("${jwt.secret.key}")
    private String secretKey;

    @Value("${jwt.expiration.time}")
    private long tiempoExpiracion;

    @Value("${jwt.refresh.expiration.time}")
    private long tiempoExpiracionRefresh;

    public String generateToken(String usuario, Long userId, String rol) {
        SecretKey key = getSigningKey();
        return Jwts.builder()
                .subject(usuario)
                .claim(CLAIM_TIPO, TIPO_ACCESS)
                .claim("userId", userId)
                .claim("rol", rol)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + tiempoExpiracion * 60 * 1000))
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(String usuario) {
        SecretKey key = getSigningKey();
        return Jwts.builder()
                .subject(usuario)
                .claim(CLAIM_TIPO, TIPO_REFRESH)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + tiempoExpiracionRefresh * 60 * 1000))
                .signWith(key)
                .compact();
    }

    public String extractUsuario(String jwt) {
        try {
            SecretKey key = getSigningKey();
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(jwt).getPayload();
            return claims.getSubject();
        } catch (ExpiredJwtException e) {
            return e.getClaims().getSubject();
        }
    }

    public Date extractTimeExpired(String jwt) {
        SecretKey key = getSigningKey();
        Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(jwt).getPayload();
        return claims.getExpiration();
    }

    public boolean isSignedByUs(String jwt) {
        try {
            SecretKey key = getSigningKey();
            Jwts.parser().verifyWith(key).build().parseSignedClaims(jwt);
            return true;
        } catch (ExpiredJwtException e) {
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean validateToken(String jwt, UserDetails userDetails) {
        final String usuario = extractUsuario(jwt);
        return usuario.equals(userDetails.getUsername()) && isAccessToken(jwt) && !isTokenExpired(jwt);
    }

    public boolean isAccessToken(String jwt) {
        return TIPO_ACCESS.equals(extractTipo(jwt));
    }

    public boolean isRefreshToken(String jwt) {
        return TIPO_REFRESH.equals(extractTipo(jwt));
    }

    private String extractTipo(String jwt) {
        try {
            SecretKey key = getSigningKey();
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(jwt).getPayload();
            return claims.get(CLAIM_TIPO, String.class);
        } catch (ExpiredJwtException e) {
            return e.getClaims().get(CLAIM_TIPO, String.class);
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    private boolean isTokenExpired(String jwt) {
        try {
            SecretKey key = getSigningKey();
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(jwt).getPayload();
            return claims.getExpiration().before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = secretKey.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
