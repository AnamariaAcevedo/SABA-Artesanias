package com.marketplace.marketplace_backend.modules.tipocontacto;

import java.util.List;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.tipocontacto.dto.TipoContactoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.tipocontacto.dto.TipoContactoFilterDto;
import com.marketplace.marketplace_backend.modules.tipocontacto.dto.TipoContactoResponseDto;
import com.marketplace.marketplace_backend.modules.tipocontacto.dto.TipoContactoUpdateRequestDto;

// Operaciones de negocio disponibles para el módulo TipoContacto
public interface TipoContactoService {
    TipoContactoResponseDto create(TipoContactoCreateRequestDto request);

    TipoContactoResponseDto update(Long id, TipoContactoUpdateRequestDto request);

    TipoContactoResponseDto get(Long id);

    void delete(Long id);

    PagedResult<List<TipoContactoResponseDto>> findAll(TipoContactoFilterDto filter);
}
