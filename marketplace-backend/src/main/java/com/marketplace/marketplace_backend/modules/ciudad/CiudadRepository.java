package com.marketplace.marketplace_backend.modules.ciudad;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Acceso a datos de Ciudad: CRUD y búsquedas por nombre/departamento
public interface CiudadRepository extends JpaRepository<Ciudad, Long> {
    Page<Ciudad> findAllByOrderByIdAsc(Pageable pageable);

    Page<Ciudad> findByNombreContainingIgnoreCaseAndDepartamento_Id(
            String nombre,
            Long idDepartamento,
            Pageable pageable
    );

    Page<Ciudad> findByNombreContainingIgnoreCase(String nombre, Pageable pageable);

    Page<Ciudad> findByDepartamento_Id(Long idDepartamento, Pageable pageable);

    Optional<Ciudad> findByNombreIgnoreCaseAndDepartamento_IdAndDeletedAtIsNull(String nombre, Long idDepartamento);
}
