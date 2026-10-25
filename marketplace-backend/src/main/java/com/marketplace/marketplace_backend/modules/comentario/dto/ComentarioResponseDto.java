package com.marketplace.marketplace_backend.modules.comentario.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los datos de un comentario
public class ComentarioResponseDto {
    private Long id;
    private String contenido;
    private Long idPublicacion;
    private Long idUsuario;
    private String nombreUsuario;
    private LocalDateTime createdAt;
}
