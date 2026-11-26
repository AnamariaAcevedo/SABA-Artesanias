package com.marketplace.marketplace_backend.modules.departamento.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// DTO de filtros para listar departamentos con paginación
public class DepartamentoFilterDto {
    private Integer page = 1;
    private Integer perPage = 10;

    private String nombre;
    private Long idPais;
}
