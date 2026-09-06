package com.marketplace.marketplace_backend.modules.tienda.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los datos de una tienda para el cliente
public class TiendaResponseDto {
    private Long id;
    private String nombre;
    private String descripcion;
    private Long idDireccion;
    private String nombreDireccion;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
