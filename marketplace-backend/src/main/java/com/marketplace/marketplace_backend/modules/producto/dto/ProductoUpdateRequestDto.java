package com.marketplace.marketplace_backend.modules.producto.dto;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para actualizar los datos de un producto existente
public class ProductoUpdateRequestDto {

    @Size(max = 100, message = "El nombre no puede tener más de 100 caracteres")
    private String nombre;

    private String descripcion;

    @PositiveOrZero(message = "El precio no puede ser negativo")
    private Double precio;

    @PositiveOrZero(message = "La puntuación no puede ser negativa")
    private Double puntuacion;

    @PositiveOrZero(message = "El descuento no puede ser negativo")
    private Double descuento;

    @PositiveOrZero(message = "La cantidad disponible no puede ser negativa")
    private Integer cantidadDisponible;

    private Long idTienda;
}
