package com.marketplace.marketplace_backend.modules.productosubcategoria;

import com.marketplace.marketplace_backend.common.BaseEntity;
import com.marketplace.marketplace_backend.modules.producto.Producto;
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
// Entidad puente entre Producto y Subcategoria
public class ProductoSubcategoria extends BaseEntity {

    @EmbeddedId
    private ProductoSubcategoriaId id = new ProductoSubcategoriaId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("productoId")
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("subcategoriaId")
    @JoinColumn(name = "subcategoria_id", nullable = false)
    private Subcategoria subcategoria;

    public ProductoSubcategoria(Producto producto, Subcategoria subcategoria) {
        this.producto = producto;
        this.subcategoria = subcategoria;
        this.id = new ProductoSubcategoriaId(producto.getId(), subcategoria.getId());
    }
}
