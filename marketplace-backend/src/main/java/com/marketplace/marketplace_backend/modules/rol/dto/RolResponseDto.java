package com.marketplace.marketplace_backend.modules.rol.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los datos de un rol para el cliente
public class RolResponseDto {
    private Long id;
    private String nombre;
    private Boolean activo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
