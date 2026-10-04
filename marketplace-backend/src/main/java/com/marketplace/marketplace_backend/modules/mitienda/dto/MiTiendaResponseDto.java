package com.marketplace.marketplace_backend.modules.mitienda.dto;

import com.marketplace.marketplace_backend.modules.tiendausuario.TipoVinculoTienda;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los datos de la tienda que gestiona el usuario autenticado,
// su direccion completa y el tipo de vinculo (dueño o colaborador).
public class MiTiendaResponseDto {
    private Long id;
    private String nombre;
    private String descripcion;
    private TipoVinculoTienda tipoVinculo;
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
