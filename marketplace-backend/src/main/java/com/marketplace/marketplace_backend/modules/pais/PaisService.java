package com.marketplace.marketplace_backend.modules.pais;

import java.util.List;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.pais.dto.PaisCreateRequestDto;
import com.marketplace.marketplace_backend.modules.pais.dto.PaisFilterDto;
import com.marketplace.marketplace_backend.modules.pais.dto.PaisResponseDto;
import com.marketplace.marketplace_backend.modules.pais.dto.PaisUpdateRequestDto;

// Operaciones de negocio disponibles para el módulo Pais
public interface PaisService {
    PaisResponseDto create(PaisCreateRequestDto request);

    PaisResponseDto update(Long id, PaisUpdateRequestDto request);

    PaisResponseDto get(Long id);

    void delete(Long id);

    PagedResult<List<PaisResponseDto>> findAll(PaisFilterDto filter);
}
