package com.marketplace.marketplace_backend.modules.tienda;

import java.util.List;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.tienda.dto.TiendaCreateRequestDto;
import com.marketplace.marketplace_backend.modules.tienda.dto.TiendaFilterDto;
import com.marketplace.marketplace_backend.modules.tienda.dto.TiendaResponseDto;
import com.marketplace.marketplace_backend.modules.tienda.dto.TiendaUpdateRequestDto;

// Operaciones de negocio disponibles para el módulo Tienda
public interface TiendaService {
    TiendaResponseDto create(TiendaCreateRequestDto request);

    TiendaResponseDto update(Long id, TiendaUpdateRequestDto request);

    TiendaResponseDto get(Long id);

    void delete(Long id);

    PagedResult<List<TiendaResponseDto>> findAll(TiendaFilterDto filter);
}
