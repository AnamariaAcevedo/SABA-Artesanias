package com.marketplace.marketplace_backend.modules.direccion.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// DTO de filtros para listar direcciones con paginación
public class DireccionFilterDto {
    private Integer page = 1;
    private Integer perPage = 10;

    private String nombre;
    private Long idBarrio;
}
