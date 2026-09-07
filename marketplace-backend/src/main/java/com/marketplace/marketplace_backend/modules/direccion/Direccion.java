package com.marketplace.marketplace_backend.modules.direccion;

import com.marketplace.marketplace_backend.common.BaseEntity;
import com.marketplace.marketplace_backend.modules.barrio.Barrio;
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
// Entidad que representa la direccion de un usuario. Apunta a Barrio (nivel mas
// especifico), desde donde se puede recorrer Ciudad -> Departamento -> Pais.
// No incluye idTienda todavia (se agregara cuando exista el modulo Tienda).
public class Direccion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String calle;

    @Column(name = "nombre_edificio", length = 100)
    private String nombreEdificio;

    @Column(name = "nro_casa")
    private Integer nroCasa;

    @Column(name = "nro_departamento", length = 50)
    private String nroDepartamento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barrio_id", nullable = false)
    private Barrio barrio;
}
