package com.marketplace.marketplace_backend.modules.rolpermiso.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para asignar un permiso a un rol
public class RolPermisoRequestDto {

    @NotNull(message = "El id del permiso es obligatorio")
    private Long permisoId;
}
