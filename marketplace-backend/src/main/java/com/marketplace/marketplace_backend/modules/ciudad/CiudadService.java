package com.marketplace.marketplace_backend.modules.ciudad;

import java.util.List;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.ciudad.dto.CiudadCreateRequestDto;
import com.marketplace.marketplace_backend.modules.ciudad.dto.CiudadFilterDto;
import com.marketplace.marketplace_backend.modules.ciudad.dto.CiudadResponseDto;
import com.marketplace.marketplace_backend.modules.ciudad.dto.CiudadUpdateRequestDto;

// Operaciones de negocio disponibles para el módulo Ciudad
public interface CiudadService {
    CiudadResponseDto create(CiudadCreateRequestDto request);

    CiudadResponseDto update(Long id, CiudadUpdateRequestDto request);

    CiudadResponseDto get(Long id);

    void delete(Long id);

    PagedResult<List<CiudadResponseDto>> findAll(CiudadFilterDto filter);
}
