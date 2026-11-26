package com.marketplace.marketplace_backend.modules.categoriasubcategoria;

import com.marketplace.marketplace_backend.common.BaseEntity;
import com.marketplace.marketplace_backend.modules.categoria.Categoria;
import com.marketplace.marketplace_backend.modules.subcategoria.Subcategoria;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// Entidad puente entre Categoria y Subcategoria
public class CategoriaSubcategoria extends BaseEntity {

    @EmbeddedId
    private CategoriaSubcategoriaId id = new CategoriaSubcategoriaId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("categoriaId")
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("subcategoriaId")
    @JoinColumn(name = "subcategoria_id", nullable = false)
    private Subcategoria subcategoria;

    public CategoriaSubcategoria(Categoria categoria, Subcategoria subcategoria) {
        this.categoria = categoria;
        this.subcategoria = subcategoria;
        this.id = new CategoriaSubcategoriaId(categoria.getId(), subcategoria.getId());
    }
}
