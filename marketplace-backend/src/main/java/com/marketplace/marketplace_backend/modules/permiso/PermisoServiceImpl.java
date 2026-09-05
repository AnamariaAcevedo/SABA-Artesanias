package com.marketplace.marketplace_backend.modules.permiso;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.permiso.dto.PermisoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.permiso.dto.PermisoFilterDto;
import com.marketplace.marketplace_backend.modules.permiso.dto.PermisoResponseDto;
import com.marketplace.marketplace_backend.modules.permiso.dto.PermisoUpdateRequestDto;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@Service
// Implementación de la lógica de negocio para gestionar permisos
public class PermisoServiceImpl implements PermisoService {

    private final PermisoRepository permisoRepository;

    @Override
    @Transactional
    public PermisoResponseDto create(PermisoCreateRequestDto request) {
        permisoRepository.findByActionIgnoreCaseAndResourceIgnoreCase(request.getAction(), request.getResource())
                .ifPresent(p -> {
                    throw new IllegalStateException("Ya existe un permiso con esa acción y recurso");
                });

        Permiso permiso = new Permiso();
        permiso.setAction(request.getAction());
        permiso.setResource(request.getResource());
        Permiso saved = permisoRepository.save(permiso);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public PermisoResponseDto update(Long id, PermisoUpdateRequestDto request) {
        Permiso permiso = permisoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Permiso no encontrado con ID: " + id));

        if (request.getAction() == null && request.getResource() == null) {
            throw new IllegalArgumentException("Debe enviar al menos un campo a actualizar.");
        }

        if (request.getAction() != null) {
            permiso.setAction(request.getAction());
        }

        if (request.getResource() != null) {
            permiso.setResource(request.getResource());
        }

        Permiso updated = permisoRepository.save(permiso);
        return toResponse(updated);
    }

    @Override
    public PermisoResponseDto get(Long id) {
        Permiso permiso = permisoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Permiso no encontrado con ID: " + id));
        return toResponse(permiso);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Permiso permiso = permisoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Permiso no encontrado con ID: " + id));

        // Cuando exista el módulo rolPermiso (SABA-54), validar que el permiso
        // no esté asignado a ningún rol antes de permitir el borrado.
        permiso.setDeletedAt(LocalDateTime.now());
        permisoRepository.save(permiso);
    }

    @Override
    public PagedResult<List<PermisoResponseDto>> findAll(PermisoFilterDto filter) {
        int page = filter.getPage();
        int perPage = filter.getPerPage();

        Pageable pageable = PageRequest.of(page - 1, perPage);

        String action = filter.getAction();
        if (action != null) {
            action = action.trim();
            if (action.isEmpty()) action = null;
        }

        String resource = filter.getResource();
        if (resource != null) {
            resource = resource.trim();
            if (resource.isEmpty()) resource = null;
        }

        boolean hasAction = action != null;
        boolean hasResource = resource != null;

        Page<Permiso> result;

        if (!hasAction && !hasResource) {
            result = permisoRepository.findAllByOrderByIdAsc(pageable);
        } else if (hasAction && hasResource) {
            result = permisoRepository.findByActionContainingIgnoreCaseOrResourceContainingIgnoreCase(action, resource, pageable);
        } else if (hasAction) {
            result = permisoRepository.findByActionContainingIgnoreCase(action, pageable);
        } else {
            result = permisoRepository.findByResourceContainingIgnoreCase(resource, pageable);
        }

        List<PermisoResponseDto> data = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) result.getTotalElements());
    }

    @Override
    public List<PermisoResponseDto> findAllOptions() {
        return permisoRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    private PermisoResponseDto toResponse(Permiso permiso) {
        return new PermisoResponseDto(
                permiso.getId(),
                permiso.getAction(),
                permiso.getResource(),
                permiso.getCreatedAt(),
                permiso.getUpdatedAt()
        );
    }
}
