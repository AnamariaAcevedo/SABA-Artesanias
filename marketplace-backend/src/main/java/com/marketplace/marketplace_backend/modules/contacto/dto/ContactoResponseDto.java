package com.marketplace.marketplace_backend.modules.contacto.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los datos de un contacto para el cliente
public class ContactoResponseDto {
    private Long id;
    private String enlace;
    private String usuario;
    private String nroTelefono;
    private Long idTipoContacto;
    private String nombreTipoContacto;
    private Long idTienda;
    private String nombreTienda;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
