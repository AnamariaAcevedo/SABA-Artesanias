package com.marketplace.marketplace_backend.modules.ciudad.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los datos de una ciudad para el cliente
public class CiudadResponseDto {
    private Long id;
    private String nombre;
    private Long idDepartamento;
    private String nombreDepartamento;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
