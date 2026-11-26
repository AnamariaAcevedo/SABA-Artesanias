package com.marketplace.marketplace_backend.modules.productosubcategoria.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con la subcategoria asignada a un producto
public class ProductoSubcategoriaResponseDto {
    private Long subcategoriaId;
    private String subcategoriaNombre;
}
