package com.marketplace.marketplace_backend.modules.departamento.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los datos de un departamento para el cliente
public class DepartamentoResponseDto {
    private Long id;
    private String nombre;
    private Long idPais;
    private String nombrePais;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
