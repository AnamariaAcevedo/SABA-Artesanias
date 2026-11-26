package com.marketplace.marketplace_backend.modules.subcategoria.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// DTO de filtros para listar subcategorias con paginación
public class SubcategoriaFilterDto {
    private Integer page = 1;
    private Integer perPage = 10;

    private String nombre;
}
