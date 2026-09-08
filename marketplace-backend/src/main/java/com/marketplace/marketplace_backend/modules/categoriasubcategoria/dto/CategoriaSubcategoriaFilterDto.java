package com.marketplace.marketplace_backend.modules.categoriasubcategoria.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// DTO de filtros para listar las subcategorias asignadas a una categoria, con paginación
public class CategoriaSubcategoriaFilterDto {
    private Integer page = 1;
    private Integer perPage = 10;
}
