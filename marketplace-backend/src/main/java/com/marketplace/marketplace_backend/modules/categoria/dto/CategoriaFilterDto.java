package com.marketplace.marketplace_backend.modules.categoria.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// DTO de filtros para listar categorias con paginación
public class CategoriaFilterDto {
    private Integer page = 1;
    private Integer perPage = 10;

    private String nombre;
}
