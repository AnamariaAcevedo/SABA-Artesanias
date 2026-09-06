package com.marketplace.marketplace_backend.modules.ciudad.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// DTO de filtros para listar ciudades con paginación
public class CiudadFilterDto {
    private Integer page = 1;
    private Integer perPage = 10;

    private String nombre;
    private Long idDepartamento;
}
