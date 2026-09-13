package com.marketplace.marketplace_backend.modules.imagenproducto;

import com.marketplace.marketplace_backend.common.BaseEntity;
import com.marketplace.marketplace_backend.modules.producto.Producto;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// Entidad que representa una imagen de un producto. Relacion 1 a muchos:
// un producto puede tener varias imagenes, cada imagen pertenece a un solo producto.
public class ImagenProducto extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "bytea")
    private byte[] imagen;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;
}
