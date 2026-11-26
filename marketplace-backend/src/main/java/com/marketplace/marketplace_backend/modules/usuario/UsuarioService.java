package com.marketplace.marketplace_backend.modules.usuario;

import java.util.List;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.usuario.dto.UsuarioCreateRequestDto;
import com.marketplace.marketplace_backend.modules.usuario.dto.UsuarioFilterDto;
import com.marketplace.marketplace_backend.modules.usuario.dto.UsuarioResponseDto;
import com.marketplace.marketplace_backend.modules.usuario.dto.UsuarioUpdateRequestDto;

// Operaciones de negocio disponibles para el módulo Usuario
public interface UsuarioService {
    UsuarioResponseDto create(UsuarioCreateRequestDto request);

    UsuarioResponseDto update(Long id, UsuarioUpdateRequestDto request);

    UsuarioResponseDto get(Long id);

    void delete(Long id);

    PagedResult<List<UsuarioResponseDto>> findAll(UsuarioFilterDto filter);

    List<UsuarioResponseDto> findAllOptions();
}
