package com.marketplace.marketplace_backend.modules.producto.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

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
    // Precio con el descuento ya aplicado; igual a precio si no tiene descuento.
    private Double precioFinal;
    private Double puntuacion;
    private Double descuento;
    private Integer cantidadDisponible;
    private Long idTienda;
    private String nombreTienda;
    private List<Long> idsSubcategorias;
    private List<String> nombresSubcategorias;
    private Long idImagenPrincipal;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
