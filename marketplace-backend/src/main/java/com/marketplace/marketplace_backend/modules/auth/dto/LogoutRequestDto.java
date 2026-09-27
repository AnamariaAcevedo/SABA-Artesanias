package com.marketplace.marketplace_backend.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para recibir el refresh token a invalidar al cerrar sesión
public class LogoutRequestDto {

    @NotBlank(message = "El refreshToken es obligatorio")
    private String refreshToken;
}
