package com.marketplace.marketplace_backend.modules.pais.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para actualizar el nombre de un pais existente
public class PaisUpdateRequestDto {

    @Size(max = 50, message = "El nombre no puede tener más de 50 caracteres")
    private String nombre;
}
