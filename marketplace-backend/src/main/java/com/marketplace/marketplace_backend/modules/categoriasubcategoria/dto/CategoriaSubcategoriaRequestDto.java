package com.marketplace.marketplace_backend.modules.categoriasubcategoria.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para asignar una subcategoria a una categoria
public class CategoriaSubcategoriaRequestDto {

    @NotNull(message = "El id de la subcategoría es obligatorio")
    private Long subcategoriaId;
}
