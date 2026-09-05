package com.marketplace.marketplace_backend.modules.rolpermiso;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.permiso.Permiso;
import com.marketplace.marketplace_backend.modules.permiso.PermisoRepository;
import com.marketplace.marketplace_backend.modules.rol.Rol;
import com.marketplace.marketplace_backend.modules.rol.RolRepository;
import com.marketplace.marketplace_backend.modules.rolpermiso.dto.RolPermisoFilterDto;
import com.marketplace.marketplace_backend.modules.rolpermiso.dto.RolPermisoResponseDto;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@AllArgsConstructor
@Service
// Implementación de la lógica de negocio para asignar y consultar permisos de un rol
public class RolPermisoServiceImpl implements RolPermisoService {

    private final RolPermisoRepository rolPermisoRepository;
    private final RolRepository rolRepository;
    private final PermisoRepository permisoRepository;

    @Override
    @Transactional
    public RolPermisoResponseDto create(Long rolId, Long permisoId) {
        Rol rol = rolRepository.findById(rolId)
                .orElseThrow(() -> new EntityNotFoundException("Rol no encontrado con ID: " + rolId));

        Permiso permiso = permisoRepository.findById(permisoId)
                .orElseThrow(() -> new EntityNotFoundException("Permiso no encontrado con ID: " + permisoId));

        if (rolPermisoRepository.existsByRol_IdAndPermiso_Id(rolId, permisoId)) {
            throw new IllegalStateException("La relación ya existe");
        }

        RolPermiso saved = rolPermisoRepository.save(new RolPermiso(rol, permiso));

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long rolId, Long permisoId) {
        rolPermisoRepository.deleteByRol_IdAndPermiso_Id(rolId, permisoId);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResult<List<RolPermisoResponseDto>> listByRol(Long rolId, RolPermisoFilterDto filter) {
        if (!rolRepository.existsById(rolId)) {
            throw new EntityNotFoundException("Rol no encontrado con ID: " + rolId);
        }

        int page = Math.max(filter.getPage(), 1);
        int perPage = Math.max(filter.getPerPage(), 1);

        Pageable pageable = PageRequest.of(page - 1, perPage);

        Page<RolPermiso> result = rolPermisoRepository.findByRol_Id(rolId, pageable);

        List<RolPermisoResponseDto> data = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) result.getTotalElements());
    }

    private RolPermisoResponseDto toResponse(RolPermiso entity) {
        return new RolPermisoResponseDto(
                entity.getPermiso().getId(),
                entity.getPermiso().getAction(),
                entity.getPermiso().getResource()
        );
    }
}
