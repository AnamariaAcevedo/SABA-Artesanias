package com.marketplace.marketplace_backend.modules.cupon.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO publico de un cupon vigente, para el catalogo. No expone cantidadUsos (dato de la tienda).
public class CuponPublicoResponseDto {
    private Long id;
    private String nombre;
    private String codigo;
    private Double porcentaje;
    private Long idTienda;
    private String nombreTienda;
}
