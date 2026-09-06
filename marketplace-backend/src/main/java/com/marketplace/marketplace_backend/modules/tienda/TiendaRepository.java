package com.marketplace.marketplace_backend.modules.tienda;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

// Acceso a datos de Tienda: CRUD y búsqueda por nombre
public interface TiendaRepository extends JpaRepository<Tienda, Long> {
    Page<Tienda> findAllByOrderByIdAsc(Pageable pageable);

    Page<Tienda> findByNombreContainingIgnoreCase(String nombre, Pageable pageable);
}
