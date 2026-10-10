package com.marketplace.marketplace_backend.modules.cupon;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Acceso a datos de Cupon
public interface CuponRepository extends JpaRepository<Cupon, Long> {
    Optional<Cupon> findByCodigoIgnoreCase(String codigo);

    boolean existsByCodigoIgnoreCase(String codigo);

    Page<Cupon> findByTienda_IdOrderByIdDesc(Long idTienda, Pageable pageable);

    Optional<Cupon> findByIdAndTienda_Id(Long id, Long idTienda);
}
