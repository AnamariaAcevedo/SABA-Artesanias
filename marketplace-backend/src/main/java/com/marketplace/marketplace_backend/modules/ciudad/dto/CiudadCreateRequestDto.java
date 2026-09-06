package com.marketplace.marketplace_backend.modules.ciudad.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para crear una ciudad nueva
public class CiudadCreateRequestDto {

    @NotBlank(message = "El nombre de la ciudad no puede estar vacío")
    @Size(max = 50, message = "El nombre no puede tener más de 50 caracteres")
    private String nombre;

    @NotNull(message = "El departamento es obligatorio")
    private Long idDepartamento;
}
