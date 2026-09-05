package com.marketplace.marketplace_backend.modules.permiso.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// DTO de filtros para listar permisos con paginación
public class PermisoFilterDto {
    private Integer page = 1;
    private Integer perPage = 10;

    private String action;
    private String resource;
}
