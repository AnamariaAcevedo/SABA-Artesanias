package com.marketplace.marketplace_backend.modules.rol;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Acceso a datos de Rol: CRUD y búsquedas por nombre/estado activo
public interface RolRepository extends JpaRepository<Rol, Long> {
    Page<Rol> findAllByOrderByIdAsc(Pageable pageable);

    Page<Rol> findByNombreContainingIgnoreCaseAndActivo(
            String nombre,
            Boolean activo,
            Pageable pageable
    );

    Page<Rol> findByNombreContainingIgnoreCase(String nombre, Pageable pageable);

    Page<Rol> findByActivo(Boolean activo, Pageable pageable);

    Optional<Rol> findByNombreAndDeletedAtIsNull(String nombre);
}
