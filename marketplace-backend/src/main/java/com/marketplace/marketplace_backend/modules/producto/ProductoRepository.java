package com.marketplace.marketplace_backend.modules.producto;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// Acceso a datos de Producto: CRUD y búsquedas por nombre/tienda/subcategoria
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    Page<Producto> findAllByOrderByIdAsc(Pageable pageable);

    Page<Producto> findByNombreContainingIgnoreCaseAndTienda_Id(
            String nombre,
            Long idTienda,
            Pageable pageable
    );

    Page<Producto> findByNombreContainingIgnoreCase(String nombre, Pageable pageable);

    Page<Producto> findByTienda_Id(Long idTienda, Pageable pageable);

    // Variantes con restricción adicional por id (usadas cuando se filtra por categoria/subcategoria)
    Page<Producto> findByIdIn(List<Long> ids, Pageable pageable);

    Page<Producto> findByIdInAndNombreContainingIgnoreCase(List<Long> ids, String nombre, Pageable pageable);

    Page<Producto> findByIdInAndTienda_Id(List<Long> ids, Long idTienda, Pageable pageable);

    Page<Producto> findByIdInAndNombreContainingIgnoreCaseAndTienda_Id(
            List<Long> ids,
            String nombre,
            Long idTienda,
            Pageable pageable
    );
}
