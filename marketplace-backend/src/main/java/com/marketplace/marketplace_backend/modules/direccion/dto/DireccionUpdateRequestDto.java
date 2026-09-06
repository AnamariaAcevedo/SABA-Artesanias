package com.marketplace.marketplace_backend.modules.direccion.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para actualizar los datos de una direccion existente
public class DireccionUpdateRequestDto {

    @Size(max = 100, message = "El nombre no puede tener más de 100 caracteres")
    private String nombre;

    private Integer nroCasa;

    @Size(max = 50, message = "El número de departamento no puede tener más de 50 caracteres")
    private String nroDepartamento;

    private Long idBarrio;
}
