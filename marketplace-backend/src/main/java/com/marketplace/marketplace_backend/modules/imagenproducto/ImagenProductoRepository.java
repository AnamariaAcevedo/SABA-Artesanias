package com.marketplace.marketplace_backend.modules.imagenproducto;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// Acceso a datos de ImagenProducto: CRUD y búsqueda por producto
public interface ImagenProductoRepository extends JpaRepository<ImagenProducto, Long> {
    List<ImagenProducto> findByProducto_IdOrderByIdAsc(Long idProducto);

    Optional<ImagenProducto> findFirstByProducto_IdOrderByIdAsc(Long idProducto);
}
