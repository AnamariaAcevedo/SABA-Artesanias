package com.marketplace.marketplace_backend.modules.pais.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// DTO de filtros para listar paises con paginación
public class PaisFilterDto {
    private Integer page = 1;
    private Integer perPage = 10;

    private String nombre;
}
