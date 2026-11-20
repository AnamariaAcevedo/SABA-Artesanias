package com.marketplace.marketplace_backend.modules.productosubcategoria;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

// Acceso a datos de ProductoSubcategoria: asignación y consulta por producto/subcategoria
public interface ProductoSubcategoriaRepository extends JpaRepository<ProductoSubcategoria, ProductoSubcategoriaId> {

    boolean existsByProducto_IdAndSubcategoria_Id(Long productoId, Long subcategoriaId);

    void deleteByProducto_IdAndSubcategoria_Id(Long productoId, Long subcategoriaId);

    List<ProductoSubcategoria> findByProducto_Id(Long productoId);

    @EntityGraph(attributePaths = "subcategoria")
    List<ProductoSubcategoria> findByProducto_IdIn(Collection<Long> idsProducto);

    List<ProductoSubcategoria> findBySubcategoria_Id(Long subcategoriaId);

    List<ProductoSubcategoria> findBySubcategoria_IdIn(List<Long> idsSubcategoria);

    long countBySubcategoria_Id(Long subcategoriaId);

    void deleteBySubcategoria_Id(Long subcategoriaId);
}
