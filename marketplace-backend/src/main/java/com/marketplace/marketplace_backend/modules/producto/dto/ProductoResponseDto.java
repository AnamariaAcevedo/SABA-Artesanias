package com.marketplace.marketplace_backend.modules.producto.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los datos de un producto para el cliente
public class ProductoResponseDto {
    private Long id;
    private String nombre;
    private String descripcion;
    private Double precio;
    private Double puntuacion;
    private Double descuento;
    private Integer cantidadDisponible;
    private Long idTienda;
    private String nombreTienda;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
