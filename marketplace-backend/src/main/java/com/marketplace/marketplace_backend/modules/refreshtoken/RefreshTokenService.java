package com.marketplace.marketplace_backend.modules.refreshtoken;

import java.util.Optional;

// Operaciones de negocio para crear, validar e invalidar refresh tokens
public interface RefreshTokenService {
    RefreshToken createRefreshToken(String usuario);

    Optional<RefreshToken> findByToken(String token);

    void deleteToken(String token);

    boolean validateRefreshToken(String refreshToken);
}
