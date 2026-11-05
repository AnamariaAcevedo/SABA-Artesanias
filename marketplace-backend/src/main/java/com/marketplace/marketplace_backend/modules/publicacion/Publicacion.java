package com.marketplace.marketplace_backend.modules.publicacion;

import com.marketplace.marketplace_backend.common.BaseEntity;
import com.marketplace.marketplace_backend.modules.cupon.Cupon;
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
// Publicacion de una tienda (noticia o promocion) visible para los compradores.
// Puede enlazar opcionalmente un cupon de la misma tienda que esta promocionando.
public class Publicacion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(nullable = false, columnDefinition = "text")
    private String contenido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tienda_id", nullable = false)
    private Tienda tienda;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cupon_id")
    private Cupon cupon;
}
