package com.marketplace.marketplace_backend.modules.productosubcategoria;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode
// Clave compuesta de ProductoSubcategoria: combinación de producto y subcategoria
public class ProductoSubcategoriaId implements Serializable {
    private Long productoId;
    private Long subcategoriaId;
}
