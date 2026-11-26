package com.marketplace.marketplace_backend.modules.pedido;

import com.marketplace.marketplace_backend.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// Comprobante de pago de un pedido. Va en su propia tabla para no cargar el archivo cada
// vez que se lista un pedido. Tiene datos del pago del cliente: a diferencia de las imagenes
// de producto no es publico, solo lo sirve la tienda dueña del pedido.
public class ComprobantePedido extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "bytea")
    private byte[] archivo;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false, unique = true)
    private Pedido pedido;
}
