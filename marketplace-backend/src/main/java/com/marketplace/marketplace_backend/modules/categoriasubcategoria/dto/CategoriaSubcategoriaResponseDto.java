package com.marketplace.marketplace_backend.modules.categoriasubcategoria.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con la subcategoria asignada a una categoria
public class CategoriaSubcategoriaResponseDto {
    private Long subcategoriaId;
    private String subcategoriaNombre;
}
