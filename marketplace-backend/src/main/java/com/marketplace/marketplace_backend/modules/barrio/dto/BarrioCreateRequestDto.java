package com.marketplace.marketplace_backend.modules.barrio.dto;

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
// DTO para crear un barrio nuevo
public class BarrioCreateRequestDto {

    @NotBlank(message = "El nombre del barrio no puede estar vacío")
    @Size(max = 50, message = "El nombre no puede tener más de 50 caracteres")
    private String nombre;

    @NotNull(message = "La ciudad es obligatoria")
    private Long idCiudad;
}
