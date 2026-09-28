package com.marketplace.marketplace_backend.modules.tipocontacto;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Acceso a datos de TipoContacto: CRUD y búsqueda por nombre
public interface TipoContactoRepository extends JpaRepository<TipoContacto, Long> {
    Page<TipoContacto> findAllByOrderByIdAsc(Pageable pageable);

    Page<TipoContacto> findByNombreContainingIgnoreCase(String nombre, Pageable pageable);

    Optional<TipoContacto> findByNombreIgnoreCaseAndDeletedAtIsNull(String nombre);
}
