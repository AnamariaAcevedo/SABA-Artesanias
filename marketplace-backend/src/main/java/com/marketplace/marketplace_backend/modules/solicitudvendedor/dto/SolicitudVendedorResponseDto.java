package com.marketplace.marketplace_backend.modules.solicitudvendedor.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los datos de una solicitud para ser vendedor
public class SolicitudVendedorResponseDto {
    private Long id;
    private String estado;
    private String motivoRechazo;
    private Long idUsuario;
    private String usuario;
    private String nombre;
    private String apellido;
    private String email;
    private String nombreTienda;
    private String descripcionTienda;
    private String calle;
    private String nombreEdificio;
    private Integer nroCasa;
    private String nroDepartamento;
    private Long idBarrio;
    private String nombreBarrio;
    private String nombreCiudad;
    private String telefono;
    private LocalDateTime createdAt;
}
