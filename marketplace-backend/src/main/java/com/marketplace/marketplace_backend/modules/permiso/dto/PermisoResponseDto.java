package com.marketplace.marketplace_backend.modules.permiso.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los datos de un permiso para el cliente
public class PermisoResponseDto {
    private Long id;
    private String action;
    private String resource;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
