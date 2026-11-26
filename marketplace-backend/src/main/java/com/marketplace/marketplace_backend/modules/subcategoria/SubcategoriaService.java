package com.marketplace.marketplace_backend.modules.subcategoria;

import java.util.List;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.subcategoria.dto.SubcategoriaCreateRequestDto;
import com.marketplace.marketplace_backend.modules.subcategoria.dto.SubcategoriaFilterDto;
import com.marketplace.marketplace_backend.modules.subcategoria.dto.SubcategoriaResponseDto;
import com.marketplace.marketplace_backend.modules.subcategoria.dto.SubcategoriaUpdateRequestDto;

// Operaciones de negocio disponibles para el módulo Subcategoria
public interface SubcategoriaService {
    SubcategoriaResponseDto create(SubcategoriaCreateRequestDto request);

    SubcategoriaResponseDto update(Long id, SubcategoriaUpdateRequestDto request);

    SubcategoriaResponseDto get(Long id);

    void delete(Long id);

    PagedResult<List<SubcategoriaResponseDto>> findAll(SubcategoriaFilterDto filter);
}
