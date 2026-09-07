package com.marketplace.marketplace_backend.modules.subcategoria;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Acceso a datos de Subcategoria: CRUD y búsqueda por nombre
public interface SubcategoriaRepository extends JpaRepository<Subcategoria, Long> {
    Page<Subcategoria> findAllByOrderByIdAsc(Pageable pageable);

    Page<Subcategoria> findByNombreContainingIgnoreCase(String nombre, Pageable pageable);

    Optional<Subcategoria> findByNombreIgnoreCaseAndDeletedAtIsNull(String nombre);
}
