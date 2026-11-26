package com.marketplace.marketplace_backend.modules.categoriasubcategoria;

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
// Clave compuesta de CategoriaSubcategoria: combinación de categoria y subcategoria
public class CategoriaSubcategoriaId implements Serializable {
    private Long categoriaId;
    private Long subcategoriaId;
}
