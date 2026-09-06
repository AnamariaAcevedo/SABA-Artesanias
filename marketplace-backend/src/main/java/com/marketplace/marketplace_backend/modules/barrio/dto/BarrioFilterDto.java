package com.marketplace.marketplace_backend.modules.barrio.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// DTO de filtros para listar barrios con paginación
public class BarrioFilterDto {
    private Integer page = 1;
    private Integer perPage = 10;

    private String nombre;
    private Long idCiudad;
}
