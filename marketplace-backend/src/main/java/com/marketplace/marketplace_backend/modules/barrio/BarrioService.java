package com.marketplace.marketplace_backend.modules.barrio;

import java.util.List;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.barrio.dto.BarrioCreateRequestDto;
import com.marketplace.marketplace_backend.modules.barrio.dto.BarrioFilterDto;
import com.marketplace.marketplace_backend.modules.barrio.dto.BarrioResponseDto;
import com.marketplace.marketplace_backend.modules.barrio.dto.BarrioUpdateRequestDto;

// Operaciones de negocio disponibles para el módulo Barrio
public interface BarrioService {
    BarrioResponseDto create(BarrioCreateRequestDto request);

    BarrioResponseDto update(Long id, BarrioUpdateRequestDto request);

    BarrioResponseDto get(Long id);

    void delete(Long id);

    PagedResult<List<BarrioResponseDto>> findAll(BarrioFilterDto filter);
}
