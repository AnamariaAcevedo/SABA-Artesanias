package com.marketplace.marketplace_backend.modules.perfil.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los datos del perfil del usuario autenticado, incluyendo
// su direccion completa (barrio, ciudad, departamento, pais). Sin contraseña.
public class PerfilResponseDto {
    private Long id;
    private String nombre;
    private String apellido;
    private String email;
    private String usuario;
    // Desde cuándo puede volver a cambiar su nombre de usuario; null = ya puede.
    private LocalDateTime proximoCambioUsuario;
    private String calle;
    private String nombreEdificio;
    private Integer nroCasa;
    private String nroDepartamento;
    private Long idBarrio;
    private String nombreBarrio;
    private Long idCiudad;
    private String nombreCiudad;
    private Long idDepartamento;
    private String nombreDepartamento;
    private Long idPais;
    private String nombrePais;
}
