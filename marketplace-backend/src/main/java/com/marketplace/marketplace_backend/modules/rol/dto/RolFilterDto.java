package com.marketplace.marketplace_backend.modules.rol.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// DTO de filtros para listar roles con paginación
public class RolFilterDto {
    private Integer page = 1;
    private Integer perPage = 10;

    private String nombre;
    private Boolean activo;
}
