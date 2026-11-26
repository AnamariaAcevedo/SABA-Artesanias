package com.marketplace.marketplace_backend.modules.categoriasubcategoria;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.categoriasubcategoria.dto.CategoriaSubcategoriaFilterDto;
import com.marketplace.marketplace_backend.modules.categoriasubcategoria.dto.CategoriaSubcategoriaResponseDto;

import java.util.List;

// Operaciones de negocio para asignar y consultar subcategorias de una categoria
public interface CategoriaSubcategoriaService {
    CategoriaSubcategoriaResponseDto create(Long categoriaId, Long subcategoriaId);

    void delete(Long categoriaId, Long subcategoriaId);

    PagedResult<List<CategoriaSubcategoriaResponseDto>> listByCategoria(Long categoriaId, CategoriaSubcategoriaFilterDto filter);
}
