package com.marketplace.marketplace_backend.modules.contacto;

import com.marketplace.marketplace_backend.common.BaseEntity;
import com.marketplace.marketplace_backend.modules.tienda.Tienda;
import com.marketplace.marketplace_backend.modules.tipocontacto.TipoContacto;
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
// Entidad que representa un canal de contacto de una tienda (ej: WhatsApp, Instagram, Email)
public class Contacto extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String enlace;

    @Column(nullable = false, length = 100)
    private String usuario;

    @Column(name = "nro_telefono", length = 20)
    private String nroTelefono;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_contacto_id", nullable = false)
    private TipoContacto tipoContacto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tienda_id", nullable = false)
    private Tienda tienda;
}
