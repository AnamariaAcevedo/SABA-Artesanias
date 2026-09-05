package com.marketplace.marketplace_backend.modules.permiso.dto;

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
// DTO para crear un permiso nuevo
public class PermisoCreateRequestDto {

    @NotBlank(message = "La acción no puede estar vacía")
    @Size(max = 50, message = "La acción no puede tener más de 50 caracteres")
    private String action;

    @NotBlank(message = "El recurso no puede estar vacío")
    @Size(max = 50, message = "El recurso no puede tener más de 50 caracteres")
    private String resource;
}
