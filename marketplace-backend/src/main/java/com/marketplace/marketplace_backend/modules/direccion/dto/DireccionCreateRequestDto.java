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

    @NotBlank(message = "La calle no puede estar vacía")
    @Size(max = 100, message = "La calle no puede tener más de 100 caracteres")
    private String calle;

    @Size(max = 100, message = "El nombre del edificio no puede tener más de 100 caracteres")
    private String nombreEdificio;

    // Si no hay nombreEdificio, nroCasa es obligatorio.
    // Si hay nombreEdificio, nroDepartamento es obligatorio.
    // (se valida en el service, porque depende del otro campo).
    private Integer nroCasa;

    @Size(max = 50, message = "El número de departamento no puede tener más de 50 caracteres")
    private String nroDepartamento;

    @NotNull(message = "El barrio es obligatorio")
    private Long idBarrio;
}
