package com.marketplace.marketplace_backend.modules.permiso;

import java.util.List;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.permiso.dto.PermisoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.permiso.dto.PermisoFilterDto;
import com.marketplace.marketplace_backend.modules.permiso.dto.PermisoResponseDto;
import com.marketplace.marketplace_backend.modules.permiso.dto.PermisoUpdateRequestDto;

// Operaciones de negocio disponibles para el módulo Permiso
public interface PermisoService {
    PermisoResponseDto create(PermisoCreateRequestDto request);

    PermisoResponseDto update(Long id, PermisoUpdateRequestDto request);

    PermisoResponseDto get(Long id);

    void delete(Long id);

    PagedResult<List<PermisoResponseDto>> findAll(PermisoFilterDto filter);

    List<PermisoResponseDto> findAllOptions();
}
