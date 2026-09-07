package com.marketplace.marketplace_backend.modules.direccion.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los datos de una direccion para el cliente, incluyendo
// la cadena completa (barrio, ciudad, departamento, pais) para poder mostrarla
// sin pedidos adicionales al frontend.
public class DireccionResponseDto {
    private Long id;
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
