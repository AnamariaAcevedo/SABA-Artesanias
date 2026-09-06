package com.marketplace.marketplace_backend.modules.departamento;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Acceso a datos de Departamento: CRUD y búsquedas por nombre/pais
public interface DepartamentoRepository extends JpaRepository<Departamento, Long> {
    Page<Departamento> findAllByOrderByIdAsc(Pageable pageable);

    Page<Departamento> findByNombreContainingIgnoreCaseAndPais_Id(
            String nombre,
            Long idPais,
            Pageable pageable
    );

    Page<Departamento> findByNombreContainingIgnoreCase(String nombre, Pageable pageable);

    Page<Departamento> findByPais_Id(Long idPais, Pageable pageable);

    Optional<Departamento> findByNombreIgnoreCaseAndPais_IdAndDeletedAtIsNull(String nombre, Long idPais);
}
