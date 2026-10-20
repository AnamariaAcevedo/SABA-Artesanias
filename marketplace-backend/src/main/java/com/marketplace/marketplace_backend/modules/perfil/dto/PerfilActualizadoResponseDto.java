package com.marketplace.marketplace_backend.modules.perfil.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta al editar el perfil. Si el usuario cambio su nombre de usuario,
// el JWT anterior deja de servir (su subject es el usuario viejo), por eso se
// devuelven tokens nuevos; si no cambio, accessToken y refreshToken vienen en null.
public class PerfilActualizadoResponseDto {
    private PerfilResponseDto perfil;
    private String accessToken;
    private String refreshToken;
}
