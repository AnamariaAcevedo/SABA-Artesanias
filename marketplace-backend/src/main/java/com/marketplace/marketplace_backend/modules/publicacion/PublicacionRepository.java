package com.marketplace.marketplace_backend.modules.publicacion;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Acceso a datos de Publicacion
public interface PublicacionRepository extends JpaRepository<Publicacion, Long> {
    Page<Publicacion> findByTienda_IdOrderByIdDesc(Long idTienda, Pageable pageable);

    Page<Publicacion> findAllByOrderByIdDesc(Pageable pageable);

    Optional<Publicacion> findByIdAndTienda_Id(Long id, Long idTienda);
}
