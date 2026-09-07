package com.marketplace.marketplace_backend.modules.productosubcategoria.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para asignar una subcategoria a un producto
public class ProductoSubcategoriaRequestDto {

    @NotNull(message = "El id de la subcategoría es obligatorio")
    private Long subcategoriaId;
}
