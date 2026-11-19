package com.marketplace.marketplace_backend.modules.producto;

import org.hibernate.annotations.ColumnDefault;
import com.marketplace.marketplace_backend.common.BaseEntity;
import com.marketplace.marketplace_backend.modules.tienda.Tienda;
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
// Entidad que representa un producto publicado por una tienda
public class Producto extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false)
    private String descripcion;

    @Column(nullable = false)
    private Double precio;

    private Double puntuacion;

    private Double descuento;

    @Column(name = "cantidad_disponible", nullable = false)
    private Integer cantidadDisponible;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tienda_id", nullable = false)
    private Tienda tienda;

    // Un producto inactivo no aparece en el catalogo ni se puede comprar, pero sigue
    // existiendo para sus pedidos y se puede volver a activar. El valor por defecto en la
    // base deja activos a los productos existentes al agregar la columna.
    @ColumnDefault("true")
    @Column(nullable = false)
    private Boolean activo = true;
}
