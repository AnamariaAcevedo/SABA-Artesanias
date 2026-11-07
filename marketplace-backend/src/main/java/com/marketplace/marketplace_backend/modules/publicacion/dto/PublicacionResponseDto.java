package com.marketplace.marketplace_backend.modules.publicacion.dto;

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
    private long cantidadComentarios;
    // Si el usuario autenticado ya reacciono; siempre false para quien no tiene sesion.
    private boolean reaccionada;
    // Fotos de la publicacion, en orden; cada una se pide a /archivos-publicacion/{id}.
    private List<Long> idsArchivos;
    private LocalDateTime fechaExpiracion;
    private boolean vigente;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
