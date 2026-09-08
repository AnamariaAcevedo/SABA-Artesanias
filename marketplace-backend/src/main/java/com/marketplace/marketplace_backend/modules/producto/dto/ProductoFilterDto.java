package com.marketplace.marketplace_backend.modules.producto.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// DTO de filtros para listar productos con paginación
public class ProductoFilterDto {
    private Integer page = 1;
    private Integer perPage = 10;

    private String nombre;
    private Long idTienda;
    private Long idCategoria;
    private Long idSubcategoria;
}
