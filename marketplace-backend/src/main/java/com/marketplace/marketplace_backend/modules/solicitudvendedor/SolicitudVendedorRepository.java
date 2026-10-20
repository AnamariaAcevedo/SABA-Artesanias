package com.marketplace.marketplace_backend.modules.solicitudvendedor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Acceso a datos de SolicitudVendedor
public interface SolicitudVendedorRepository extends JpaRepository<SolicitudVendedor, Long> {

    boolean existsByUsuario_IdAndEstado(Long idUsuario, EstadoSolicitudVendedor estado);

    Optional<SolicitudVendedor> findFirstByUsuario_IdAndEstado(Long idUsuario, EstadoSolicitudVendedor estado);

    Page<SolicitudVendedor> findByEstado(EstadoSolicitudVendedor estado, Pageable pageable);

    Page<SolicitudVendedor> findAllByOrderByIdDesc(Pageable pageable);

    Optional<SolicitudVendedor> findFirstByUsuario_IdOrderByIdDesc(Long idUsuario);
}
