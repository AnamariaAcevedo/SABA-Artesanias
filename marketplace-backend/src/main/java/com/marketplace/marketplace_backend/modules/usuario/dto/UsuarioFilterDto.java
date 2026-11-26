package com.marketplace.marketplace_backend.modules.usuario.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// DTO de filtros para listar usuarios con paginación
public class UsuarioFilterDto {
    private Integer page = 1;
    private Integer perPage = 10;

    private String nombre;
    private Boolean activo;
}
