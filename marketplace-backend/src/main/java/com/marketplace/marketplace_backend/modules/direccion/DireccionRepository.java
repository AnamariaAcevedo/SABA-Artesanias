package com.marketplace.marketplace_backend.modules.direccion;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

// Acceso a datos de Direccion: CRUD y búsquedas por nombre/barrio
public interface DireccionRepository extends JpaRepository<Direccion, Long> {
    Page<Direccion> findAllByOrderByIdAsc(Pageable pageable);

    Page<Direccion> findByNombreContainingIgnoreCaseAndBarrio_Id(
            String nombre,
            Long idBarrio,
            Pageable pageable
    );

    Page<Direccion> findByNombreContainingIgnoreCase(String nombre, Pageable pageable);

    Page<Direccion> findByBarrio_Id(Long idBarrio, Pageable pageable);
}
