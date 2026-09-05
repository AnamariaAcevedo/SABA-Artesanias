package com.marketplace.marketplace_backend.modules.rolpermiso.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// DTO de filtros para listar los permisos asignados a un rol, con paginación
public class RolPermisoFilterDto {
    private Integer page = 1;
    private Integer perPage = 10;
}
