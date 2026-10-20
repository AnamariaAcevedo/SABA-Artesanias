package com.marketplace.marketplace_backend.modules.cupon.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los datos de un cupon
public class CuponResponseDto {
    private Long id;
    private String nombre;
    private String codigo;
    private Double porcentaje;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Long idTienda;
    private String nombreTienda;
    // true si ya se uso (tiene un pedido asociado)
    private boolean usado;
    private Long idPedido;
}
