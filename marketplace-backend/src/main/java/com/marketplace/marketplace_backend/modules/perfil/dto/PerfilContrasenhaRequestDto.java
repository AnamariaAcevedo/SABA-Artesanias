package com.marketplace.marketplace_backend.modules.perfil.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para que el usuario autenticado cambie su propia contraseña
public class PerfilContrasenhaRequestDto {

    @NotBlank(message = "La contraseña actual no puede estar vacía")
    private String contrasenhaActual;

    @NotBlank(message = "La contraseña nueva no puede estar vacía")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    private String contrasenhaNueva;
}
