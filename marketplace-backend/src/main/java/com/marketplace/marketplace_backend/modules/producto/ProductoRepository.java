package com.marketplace.marketplace_backend.modules.producto;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

// Acceso a datos de Producto: CRUD y búsquedas por nombre/tienda
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    Page<Producto> findAllByOrderByIdAsc(Pageable pageable);

    Page<Producto> findByNombreContainingIgnoreCaseAndTienda_Id(
            String nombre,
            Long idTienda,
            Pageable pageable
    );

    Page<Producto> findByNombreContainingIgnoreCase(String nombre, Pageable pageable);

    Page<Producto> findByTienda_Id(Long idTienda, Pageable pageable);
}
