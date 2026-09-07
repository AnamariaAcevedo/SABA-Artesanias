package com.marketplace.marketplace_backend.modules.categoria.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para actualizar el nombre de una categoria existente
public class CategoriaUpdateRequestDto {

    @Size(max = 100, message = "El nombre no puede tener más de 100 caracteres")
    private String nombre;
}
