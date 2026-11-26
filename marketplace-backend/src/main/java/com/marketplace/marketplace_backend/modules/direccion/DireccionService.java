package com.marketplace.marketplace_backend.modules.direccion;

import java.util.List;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.direccion.dto.DireccionCreateRequestDto;
import com.marketplace.marketplace_backend.modules.direccion.dto.DireccionFilterDto;
import com.marketplace.marketplace_backend.modules.direccion.dto.DireccionResponseDto;
import com.marketplace.marketplace_backend.modules.direccion.dto.DireccionUpdateRequestDto;

// Operaciones de negocio disponibles para el módulo Direccion
public interface DireccionService {
    DireccionResponseDto create(DireccionCreateRequestDto request);

    DireccionResponseDto update(Long id, DireccionUpdateRequestDto request);

    DireccionResponseDto get(Long id);

    void delete(Long id);

    PagedResult<List<DireccionResponseDto>> findAll(DireccionFilterDto filter);
}
