package com.marketplace.marketplace_backend.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los datos del usuario autenticado y sus permisos vigentes
public class SesionActualResponseDto {
    private Long id;
    private String usuario;
    private String nombre;
    private String apellido;
    private String email;
    private String rol;
    private List<String> permisos;
}
