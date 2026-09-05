package com.marketplace.marketplace_backend.modules.permiso.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para actualizar accion y/o recurso de un permiso existente
public class PermisoUpdateRequestDto {

    @Size(max = 50, message = "La acción no puede tener más de 50 caracteres")
    private String action;

    @Size(max = 50, message = "El recurso no puede tener más de 50 caracteres")
    private String resource;
}
