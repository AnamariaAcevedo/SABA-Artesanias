package com.marketplace.marketplace_backend.modules.solicitudvendedor;

import com.marketplace.marketplace_backend.common.BaseEntity;
import com.marketplace.marketplace_backend.modules.barrio.Barrio;
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
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Solicitud para ser vendedor: guarda los datos propuestos de la tienda hasta que el administrador la acepta o rechaza
@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SolicitudVendedor extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "nombre_tienda", nullable = false, length = 100)
    private String nombreTienda;

    @Column(name = "descripcion_tienda", nullable = false)
    private String descripcionTienda;

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

    // Número en formato internacional de Paraguay, sin el signo +, por ejemplo 595981123456
    @Column(nullable = false, length = 20)
    private String telefono;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoSolicitudVendedor estado = EstadoSolicitudVendedor.PENDIENTE;

    @Column(name = "motivo_rechazo")
    private String motivoRechazo;
}
