package com.marketplace.marketplace_backend.modules.direccion.dto;

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
// DTO para crear una direccion nueva
public class DireccionCreateRequestDto {

    @NotBlank(message = "El nombre de la dirección no puede estar vacío")
    @Size(max = 100, message = "El nombre no puede tener más de 100 caracteres")
    private String nombre;

    @NotNull(message = "El número de casa es obligatorio")
    private Integer nroCasa;

    @NotBlank(message = "El número de departamento no puede estar vacío")
    @Size(max = 50, message = "El número de departamento no puede tener más de 50 caracteres")
    private String nroDepartamento;

    @NotNull(message = "El barrio es obligatorio")
    private Long idBarrio;
}
