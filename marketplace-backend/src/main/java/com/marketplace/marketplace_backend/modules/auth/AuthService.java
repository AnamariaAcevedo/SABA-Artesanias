package com.marketplace.marketplace_backend.modules.auth;

import com.marketplace.marketplace_backend.modules.auth.dto.AuthResponseDto;

// Operaciones de negocio para autenticar usuarios y refrescar tokens
public interface AuthService {
    AuthResponseDto authenticateAndGenerateToken(String usuario, String contrasenha);

    AuthResponseDto generateRefreshToken(String refreshToken, String accessToken);
}
