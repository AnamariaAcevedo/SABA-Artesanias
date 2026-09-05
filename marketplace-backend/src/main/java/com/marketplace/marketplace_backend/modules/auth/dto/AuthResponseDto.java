package com.marketplace.marketplace_backend.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta del login/refresh: tokens en el body, sin cookies
public class AuthResponseDto {
    private String accessToken;
    private String refreshToken;
    private String usuario;
}
