package com.marketplace.marketplace_backend.modules.rol;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.permiso.Permiso;
import com.marketplace.marketplace_backend.modules.permiso.PermisoRepository;
import com.marketplace.marketplace_backend.modules.rol.dto.RolConPermisosRequestDto;
import com.marketplace.marketplace_backend.modules.rol.dto.RolCreateRequestDto;
import com.marketplace.marketplace_backend.modules.rol.dto.RolFilterDto;
import com.marketplace.marketplace_backend.modules.rol.dto.RolResponseDto;
import com.marketplace.marketplace_backend.modules.rol.dto.RolUpdateRequestDto;
import com.marketplace.marketplace_backend.modules.rolpermiso.RolPermiso;
import com.marketplace.marketplace_backend.modules.rolpermiso.RolPermisoRepository;
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
// Implementación de la lógica de negocio para gestionar roles
public class RolServiceImpl implements RolService {

    private final RolRepository rolRepository;
    private final RolPermisoRepository rolPermisoRepository;
    private final PermisoRepository permisoRepository;

    @Override
    @Transactional
    public RolResponseDto create(RolCreateRequestDto request) {
        rolRepository.findByNombreAndDeletedAtIsNull(request.getNombre())
                .ifPresent(r -> {
                    throw new IllegalStateException("Ya existe un rol activo con ese nombre");
                });

        Rol rol = new Rol();
        rol.setNombre(request.getNombre());
        rol.setActivo(true);
        Rol saved = rolRepository.save(rol);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public RolResponseDto update(Long id, RolUpdateRequestDto request) {
        Rol rol = rolRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Rol no encontrado con ID: " + id));

        if (request.getNombre() == null && request.getActivo() == null) {
            throw new IllegalArgumentException("Debe enviar al menos un campo a actualizar.");
        }

        if (request.getNombre() != null) {
            rol.setNombre(request.getNombre());
        }

        if (request.getActivo() != null) {
            rol.setActivo(request.getActivo());
        }

        Rol updated = rolRepository.save(rol);
        return toResponse(updated);
    }

    @Override
    public RolResponseDto get(Long id) {
        Rol rol = rolRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Rol no encontrado con ID: " + id));
        return toResponse(rol);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Rol rol = rolRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Rol no encontrado con ID: " + id));

        // Cuando exista el módulo usuario (SABA-37/55), validar que el rol
        // no esté asignado a ningún usuario antes de permitir el borrado.
        rol.setDeletedAt(LocalDateTime.now());
        rolRepository.save(rol);
    }

    @Override
    public PagedResult<List<RolResponseDto>> findAll(RolFilterDto filter) {
        int page = filter.getPage();
        int perPage = filter.getPerPage();

        Pageable pageable = PageRequest.of(page - 1, perPage);

        String nombre = filter.getNombre();
        if (nombre != null) {
            nombre = nombre.trim();
            if (nombre.isEmpty()) nombre = null;
        }

        Boolean activo = filter.getActivo();

        boolean hasNombre = nombre != null;
        boolean hasActivo = activo != null;

        Page<Rol> result;

        if (!hasNombre && !hasActivo) {
            result = rolRepository.findAllByOrderByIdAsc(pageable);
        } else if (hasNombre && hasActivo) {
            result = rolRepository.findByNombreContainingIgnoreCaseAndActivo(nombre, activo, pageable);
        } else if (hasNombre) {
            result = rolRepository.findByNombreContainingIgnoreCase(nombre, pageable);
        } else {
            result = rolRepository.findByActivo(activo, pageable);
        }

        List<RolResponseDto> data = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) result.getTotalElements());
    }

    @Override
    public List<RolResponseDto> findAllOptions() {
        return rolRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public RolResponseDto crearConPermisos(RolConPermisosRequestDto request) {
        rolRepository.findByNombreAndDeletedAtIsNull(request.getNombre())
                .ifPresent(r -> {
                    throw new IllegalStateException("Ya existe un rol activo con ese nombre");
                });

        Rol rol = new Rol();
        rol.setNombre(request.getNombre());
        rol.setActivo(request.getActivo() != null ? request.getActivo() : true);
        Rol saved = rolRepository.save(rol);

        aplicarCambiosPermisos(saved, request.getPermisoIdsAgregar(), request.getPermisoIdsQuitar());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public RolResponseDto actualizarConPermisos(Long id, RolConPermisosRequestDto request) {
        Rol rol = rolRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Rol no encontrado con ID: " + id));

        rol.setNombre(request.getNombre());
        if (request.getActivo() != null) {
            rol.setActivo(request.getActivo());
        }
        Rol updated = rolRepository.save(rol);

        aplicarCambiosPermisos(updated, request.getPermisoIdsAgregar(), request.getPermisoIdsQuitar());

        return toResponse(updated);
    }

    // Aplica, en la misma transacción que el alta/edición del rol, los permisos
    // a agregar y a quitar. Evita que el guardado del rol quede desincronizado
    // de sus permisos si algo falla a mitad de camino.
    private void aplicarCambiosPermisos(Rol rol, List<Long> permisoIdsAgregar, List<Long> permisoIdsQuitar) {
        if (permisoIdsQuitar != null) {
            for (Long permisoId : permisoIdsQuitar) {
                rolPermisoRepository.deleteByRol_IdAndPermiso_Id(rol.getId(), permisoId);
            }
        }

        if (permisoIdsAgregar != null) {
            for (Long permisoId : permisoIdsAgregar) {
                if (rolPermisoRepository.existsByRol_IdAndPermiso_Id(rol.getId(), permisoId)) {
                    continue;
                }

                Permiso permiso = permisoRepository.findById(permisoId)
                        .orElseThrow(() -> new EntityNotFoundException("Permiso no encontrado con ID: " + permisoId));

                rolPermisoRepository.save(new RolPermiso(rol, permiso));
            }
        }
    }

    private RolResponseDto toResponse(Rol rol) {
        return new RolResponseDto(
                rol.getId(),
                rol.getNombre(),
                rol.getActivo(),
                rol.getCreatedAt(),
                rol.getUpdatedAt()
        );
    }
}
