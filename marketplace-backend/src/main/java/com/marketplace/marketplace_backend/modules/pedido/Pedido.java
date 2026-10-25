package com.marketplace.marketplace_backend.modules.pedido;

import com.marketplace.marketplace_backend.common.BaseEntity;
import com.marketplace.marketplace_backend.modules.barrio.Barrio;
import com.marketplace.marketplace_backend.modules.cupon.Cupon;
import com.marketplace.marketplace_backend.modules.tienda.Tienda;
import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"tienda_id", "numero"}))
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// Pedido de un usuario (o invitado) a una tienda. Todos sus productos pertenecen a esa
// tienda. Los datos de entrega quedan guardados como una foto del pedido (no referencian
// la cuenta ni una Direccion existente), para que no cambien si el usuario edita su perfil.
public class Pedido extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Numero correlativo del pedido dentro de su tienda (1, 2, 3...). Es el que se muestra
    // a la tienda y al cliente; el id es interno. Nullable solo para que ddl-auto=update pueda
    // agregar la columna con pedidos existentes: scripts/numerar-pedidos.sql los completa.
    private Integer numero;

    // Null cuando el pedido lo hizo un invitado sin cuenta.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tienda_id", nullable = false)
    private Tienda tienda;

    @Column(name = "nombre_receptor", nullable = false, length = 150)
    private String nombreReceptor;

    @Column(name = "telefono_receptor", nullable = false, length = 20)
    private String telefonoReceptor;

    @Column(name = "email_receptor", nullable = false)
    private String emailReceptor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barrio_id", nullable = false)
    private Barrio barrio;

    @Column(nullable = false)
    private String direccion;

    private String referencia;

    // Cupon aplicado en este pedido, si hubo. Un mismo cupon puede estar en muchos pedidos.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cupon_id")
    private Cupon cupon;

    @Column(nullable = false)
    private Double total;

    @Column(name = "fecha_pedido", nullable = false)
    private LocalDateTime fechaPedido;

    @Column(name = "fecha_entrega")
    private LocalDateTime fechaEntrega;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoPedido estado = EstadoPedido.PENDIENTE;
}
