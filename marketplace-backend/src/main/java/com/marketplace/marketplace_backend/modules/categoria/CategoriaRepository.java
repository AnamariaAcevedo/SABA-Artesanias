package com.marketplace.marketplace_backend.modules.categoria;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Acceso a datos de Categoria: CRUD y búsqueda por nombre
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    Page<Categoria> findAllByOrderByIdAsc(Pageable pageable);

    Page<Categoria> findByNombreContainingIgnoreCase(String nombre, Pageable pageable);

    Optional<Categoria> findByNombreIgnoreCaseAndDeletedAtIsNull(String nombre);
}
