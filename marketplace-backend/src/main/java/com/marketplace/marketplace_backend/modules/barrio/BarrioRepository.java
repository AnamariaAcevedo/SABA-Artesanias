package com.marketplace.marketplace_backend.modules.barrio;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Acceso a datos de Barrio: CRUD y búsquedas por nombre/ciudad
public interface BarrioRepository extends JpaRepository<Barrio, Long> {
    Page<Barrio> findAllByOrderByIdAsc(Pageable pageable);

    Page<Barrio> findByNombreContainingIgnoreCaseAndCiudad_Id(
            String nombre,
            Long idCiudad,
            Pageable pageable
    );

    Page<Barrio> findByNombreContainingIgnoreCase(String nombre, Pageable pageable);

    Page<Barrio> findByCiudad_Id(Long idCiudad, Pageable pageable);

    Optional<Barrio> findByNombreIgnoreCaseAndCiudad_IdAndDeletedAtIsNull(String nombre, Long idCiudad);
}
