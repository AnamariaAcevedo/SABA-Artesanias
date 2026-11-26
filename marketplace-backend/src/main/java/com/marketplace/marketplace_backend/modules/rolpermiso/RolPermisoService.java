package com.marketplace.marketplace_backend.modules.rolpermiso;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.rolpermiso.dto.RolPermisoFilterDto;
import com.marketplace.marketplace_backend.modules.rolpermiso.dto.RolPermisoResponseDto;

import java.util.List;

// Operaciones de negocio para asignar y consultar permisos de un rol
public interface RolPermisoService {
    RolPermisoResponseDto create(Long rolId, Long permisoId);

    void delete(Long rolId, Long permisoId);

    PagedResult<List<RolPermisoResponseDto>> listByRol(Long rolId, RolPermisoFilterDto filter);
}
