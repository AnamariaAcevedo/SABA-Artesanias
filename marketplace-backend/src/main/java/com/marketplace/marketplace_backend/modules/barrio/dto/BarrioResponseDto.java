package com.marketplace.marketplace_backend.modules.barrio.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los datos de un barrio para el cliente
public class BarrioResponseDto {
    private Long id;
    private String nombre;
    private Long idCiudad;
    private String nombreCiudad;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
