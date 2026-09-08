package com.marketplace.marketplace_backend.modules.productosubcategoria;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// Acceso a datos de ProductoSubcategoria: asignación y consulta por producto/subcategoria
public interface ProductoSubcategoriaRepository extends JpaRepository<ProductoSubcategoria, ProductoSubcategoriaId> {

    boolean existsByProducto_IdAndSubcategoria_Id(Long productoId, Long subcategoriaId);

    void deleteByProducto_IdAndSubcategoria_Id(Long productoId, Long subcategoriaId);

    List<ProductoSubcategoria> findByProducto_Id(Long productoId);

    List<ProductoSubcategoria> findBySubcategoria_Id(Long subcategoriaId);

    List<ProductoSubcategoria> findBySubcategoria_IdIn(List<Long> idsSubcategoria);
}
