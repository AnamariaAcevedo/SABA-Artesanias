package com.marketplace.marketplace_backend.modules.auth;

import com.marketplace.marketplace_backend.modules.auth.dto.AuthResponseDto;
import com.marketplace.marketplace_backend.modules.auth.dto.RegistroRequestDto;
import com.marketplace.marketplace_backend.modules.auth.dto.SesionActualResponseDto;

// Operaciones de negocio para autenticar usuarios, refrescar tokens y cerrar sesión
public interface AuthService {
    AuthResponseDto authenticateAndGenerateToken(String usuario, String contrasenha);

    AuthResponseDto generateRefreshToken(String refreshToken, String accessToken);

    AuthResponseDto registrar(RegistroRequestDto request);

    void logout(String refreshToken);

    SesionActualResponseDto obtenerSesionActual();
}
