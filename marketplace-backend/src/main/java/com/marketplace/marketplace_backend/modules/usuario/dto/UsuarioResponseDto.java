package com.marketplace.marketplace_backend.modules.usuario.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los datos de un usuario para el cliente (sin contraseña)
public class UsuarioResponseDto {
    private Long id;
    private String nombre;
    private String apellido;
    private String email;
    private String usuario;
    private Long idRol;
    private String nombreRol;
    private Long idDireccion;
    private String nombreDireccion;
    private Boolean activo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
