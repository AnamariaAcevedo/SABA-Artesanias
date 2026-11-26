package com.marketplace.marketplace_backend.modules.archivopublicacion.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los metadatos de un archivo (sin los bytes, para no sobrecargar el listado)
public class ArchivoPublicacionResponseDto {
    private Long id;
    private String contentType;
    private Long idPublicacion;
}
