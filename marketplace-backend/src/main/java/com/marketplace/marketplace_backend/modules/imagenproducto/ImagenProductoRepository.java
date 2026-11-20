package com.marketplace.marketplace_backend.modules.imagenproducto;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

// Acceso a datos de ImagenProducto: CRUD y búsqueda por producto
public interface ImagenProductoRepository extends JpaRepository<ImagenProducto, Long> {
    List<ImagenProducto> findByProducto_IdOrderByIdAsc(Long idProducto);

    List<ImagenResumenView> findByProductoIdInOrderByIdAsc(Collection<Long> idsProducto);
}
