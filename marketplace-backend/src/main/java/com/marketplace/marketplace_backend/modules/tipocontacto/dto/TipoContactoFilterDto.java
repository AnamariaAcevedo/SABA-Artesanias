package com.marketplace.marketplace_backend.modules.tipocontacto.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// DTO de filtros para listar tipos de contacto con paginación
public class TipoContactoFilterDto {
    private Integer page = 1;
    private Integer perPage = 10;

    private String nombre;
}
