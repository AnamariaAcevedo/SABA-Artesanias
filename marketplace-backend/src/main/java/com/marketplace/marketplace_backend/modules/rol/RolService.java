package com.marketplace.marketplace_backend.modules.rol;

import java.util.List;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.rol.dto.RolCreateRequestDto;
import com.marketplace.marketplace_backend.modules.rol.dto.RolFilterDto;
import com.marketplace.marketplace_backend.modules.rol.dto.RolResponseDto;
import com.marketplace.marketplace_backend.modules.rol.dto.RolUpdateRequestDto;

// Operaciones de negocio disponibles para el módulo Rol
public interface RolService {
    RolResponseDto create(RolCreateRequestDto request);

    RolResponseDto update(Long id, RolUpdateRequestDto request);

    RolResponseDto get(Long id);

    void delete(Long id);

    PagedResult<List<RolResponseDto>> findAll(RolFilterDto filter);

    List<RolResponseDto> findAllOptions();
}
