package com.marketplace.marketplace_backend.modules.pais;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Acceso a datos de Pais: CRUD y búsqueda por nombre
public interface PaisRepository extends JpaRepository<Pais, Long> {
    Page<Pais> findAllByOrderByIdAsc(Pageable pageable);

    Page<Pais> findByNombreContainingIgnoreCase(String nombre, Pageable pageable);

    Optional<Pais> findByNombreIgnoreCaseAndDeletedAtIsNull(String nombre);
}
