package com.marketplace.marketplace_backend.modules.publicacion.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los datos de una publicacion
public class PublicacionResponseDto {
    private Long id;
    private String titulo;
    private String contenido;
    private Long idTienda;
    private String nombreTienda;
    private Long idCupon;
    private String codigoCupon;
    private long cantidadReacciones;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
