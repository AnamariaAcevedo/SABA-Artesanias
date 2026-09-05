package com.marketplace.marketplace_backend.modules.rolpermiso.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con el permiso asignado a un rol
public class RolPermisoResponseDto {
    private Long permisoId;
    private String permisoAction;
    private String permisoResource;
}
