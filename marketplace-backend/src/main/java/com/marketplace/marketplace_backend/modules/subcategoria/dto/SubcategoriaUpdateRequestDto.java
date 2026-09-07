package com.marketplace.marketplace_backend.modules.subcategoria.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para actualizar el nombre de una subcategoria existente
public class SubcategoriaUpdateRequestDto {

    @Size(max = 100, message = "El nombre no puede tener más de 100 caracteres")
    private String nombre;
}
