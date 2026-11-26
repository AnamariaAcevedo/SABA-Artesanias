package com.marketplace.marketplace_backend.modules.tienda;

import org.hibernate.annotations.ColumnDefault;
import com.marketplace.marketplace_backend.common.BaseEntity;
import com.marketplace.marketplace_backend.modules.direccion.Direccion;
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
// Entidad que representa una tienda, con su propia direccion
public class Tienda extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false)
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "direccion_id", nullable = false)
    private Direccion direccion;

    // Datos de cuenta a los que el cliente transfiere el pago. Son nullable porque las tiendas
    // nacen sin ellos: los carga el dueño y, hasta entonces, la tienda no puede recibir pedidos.
    @Column(length = 100)
    private String banco;

    @Column(name = "titular_cuenta", length = 150)
    private String titularCuenta;

    @Column(name = "documento_titular", length = 30)
    private String documentoTitular;

    @Column(name = "nro_cuenta", length = 50)
    private String nroCuenta;

    @Column(name = "alias_cuenta", length = 100)
    private String aliasCuenta;

    // Una tienda inactiva no aparece en el catalogo (ni ella, ni sus productos, ni sus
    // publicaciones o cupones) y no recibe pedidos nuevos. El dueño la sigue gestionando y
    // puede reactivarla. El valor por defecto deja activas a las tiendas existentes.
    @ColumnDefault("true")
    @Column(nullable = false)
    private Boolean activo = true;

    // El alias es opcional, por eso no cuenta.
    public boolean tieneDatosDePago() {
        return banco != null && titularCuenta != null && documentoTitular != null && nroCuenta != null;
    }
}
