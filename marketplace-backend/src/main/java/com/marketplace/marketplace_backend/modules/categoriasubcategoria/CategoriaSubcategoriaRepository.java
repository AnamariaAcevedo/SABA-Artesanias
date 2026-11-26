package com.marketplace.marketplace_backend.modules.categoriasubcategoria;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// Acceso a datos de CategoriaSubcategoria: asignación y consulta por categoria
public interface CategoriaSubcategoriaRepository extends JpaRepository<CategoriaSubcategoria, CategoriaSubcategoriaId> {

    boolean existsByCategoria_IdAndSubcategoria_Id(Long categoriaId, Long subcategoriaId);

    void deleteByCategoria_IdAndSubcategoria_Id(Long categoriaId, Long subcategoriaId);

    Page<CategoriaSubcategoria> findByCategoria_Id(Long categoriaId, Pageable pageable);

    List<CategoriaSubcategoria> findByCategoria_Id(Long categoriaId);

    long countBySubcategoria_Id(Long subcategoriaId);

    void deleteByCategoria_Id(Long categoriaId);

    void deleteBySubcategoria_Id(Long subcategoriaId);
}
