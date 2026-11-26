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
// DTO para recibir el par de tokens al refrescar
public class RefreshRequestDto {

    @NotBlank(message = "El accessToken es obligatorio")
    private String accessToken;

    @NotBlank(message = "El refreshToken es obligatorio")
    private String refreshToken;
}
