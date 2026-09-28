package com.marketplace.marketplace_backend.modules.contacto.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// DTO de filtros para listar contactos con paginación
public class ContactoFilterDto {
    private Integer page = 1;
    private Integer perPage = 10;

    private Long idTienda;
    private Long idTipoContacto;
}
