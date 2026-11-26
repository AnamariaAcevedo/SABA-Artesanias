package com.marketplace.marketplace_backend.modules.ciudad.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para actualizar nombre y/o departamento de una ciudad existente
public class CiudadUpdateRequestDto {

    @Size(max = 50, message = "El nombre no puede tener más de 50 caracteres")
    private String nombre;

    private Long idDepartamento;
}
