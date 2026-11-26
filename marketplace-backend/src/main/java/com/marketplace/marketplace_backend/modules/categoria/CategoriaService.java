package com.marketplace.marketplace_backend.modules.categoria;

import java.util.List;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.categoria.dto.CategoriaCreateRequestDto;
import com.marketplace.marketplace_backend.modules.categoria.dto.CategoriaFilterDto;
import com.marketplace.marketplace_backend.modules.categoria.dto.CategoriaResponseDto;
import com.marketplace.marketplace_backend.modules.categoria.dto.CategoriaUpdateRequestDto;

// Operaciones de negocio disponibles para el módulo Categoria
public interface CategoriaService {
    CategoriaResponseDto create(CategoriaCreateRequestDto request);

    CategoriaResponseDto update(Long id, CategoriaUpdateRequestDto request);

    CategoriaResponseDto get(Long id);

    void delete(Long id);

    PagedResult<List<CategoriaResponseDto>> findAll(CategoriaFilterDto filter);
}
