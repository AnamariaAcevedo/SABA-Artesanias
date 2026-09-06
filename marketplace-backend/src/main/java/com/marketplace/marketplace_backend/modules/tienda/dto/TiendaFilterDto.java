package com.marketplace.marketplace_backend.modules.tienda.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// DTO de filtros para listar tiendas con paginación
public class TiendaFilterDto {
    private Integer page = 1;
    private Integer perPage = 10;

    private String nombre;
}
