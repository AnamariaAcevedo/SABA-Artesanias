package com.marketplace.marketplace_backend.modules.imagenproducto.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los metadatos de una imagen (sin los bytes, para no sobrecargar el listado)
public class ImagenProductoResponseDto {
    private Long id;
    private String contentType;
    private Long idProducto;
}
