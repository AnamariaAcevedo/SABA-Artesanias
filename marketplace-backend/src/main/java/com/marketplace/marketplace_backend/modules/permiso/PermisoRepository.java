package com.marketplace.marketplace_backend.modules.permiso;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Acceso a datos de Permiso: CRUD y búsquedas por accion/recurso
public interface PermisoRepository extends JpaRepository<Permiso, Long> {
    Page<Permiso> findAllByOrderByIdAsc(Pageable pageable);

    Optional<Permiso> findByActionIgnoreCaseAndResourceIgnoreCase(String action, String resource);

    Page<Permiso> findByActionContainingIgnoreCaseOrResourceContainingIgnoreCase(
            String action,
            String resource,
            Pageable pageable
    );

    Page<Permiso> findByActionContainingIgnoreCase(String action, Pageable pageable);

    Page<Permiso> findByResourceContainingIgnoreCase(String resource, Pageable pageable);
}
