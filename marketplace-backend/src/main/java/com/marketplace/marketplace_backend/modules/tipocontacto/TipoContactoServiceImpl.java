package com.marketplace.marketplace_backend.modules.tipocontacto;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.tipocontacto.dto.TipoContactoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.tipocontacto.dto.TipoContactoFilterDto;
import com.marketplace.marketplace_backend.modules.tipocontacto.dto.TipoContactoResponseDto;
import com.marketplace.marketplace_backend.modules.tipocontacto.dto.TipoContactoUpdateRequestDto;
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
// Implementación de la lógica de negocio para gestionar tipos de contacto
public class TipoContactoServiceImpl implements TipoContactoService {

    private final TipoContactoRepository tipoContactoRepository;

    @Override
    @Transactional
    public TipoContactoResponseDto create(TipoContactoCreateRequestDto request) {
        tipoContactoRepository.findByNombreIgnoreCaseAndDeletedAtIsNull(request.getNombre())
                .ifPresent(t -> {
                    throw new IllegalStateException("Ya existe un tipo de contacto activo con ese nombre");
                });

        TipoContacto tipoContacto = new TipoContacto();
        tipoContacto.setNombre(request.getNombre());
        TipoContacto saved = tipoContactoRepository.save(tipoContacto);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public TipoContactoResponseDto update(Long id, TipoContactoUpdateRequestDto request) {
        TipoContacto tipoContacto = tipoContactoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tipo de contacto no encontrado"));

        if (request.getNombre() != null) {
            tipoContacto.setNombre(request.getNombre());
        }

        TipoContacto updated = tipoContactoRepository.save(tipoContacto);
        return toResponse(updated);
    }

    @Override
    public TipoContactoResponseDto get(Long id) {
        TipoContacto tipoContacto = tipoContactoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tipo de contacto no encontrado"));
        return toResponse(tipoContacto);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        TipoContacto tipoContacto = tipoContactoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tipo de contacto no encontrado"));

        tipoContacto.setDeletedAt(LocalDateTime.now());
        tipoContactoRepository.save(tipoContacto);
    }

    @Override
    public PagedResult<List<TipoContactoResponseDto>> findAll(TipoContactoFilterDto filter) {
        int page = filter.getPage();
        int perPage = filter.getPerPage();

        Pageable pageable = PageRequest.of(page - 1, perPage);

        String nombre = filter.getNombre();
        if (nombre != null) {
            nombre = nombre.trim();
            if (nombre.isEmpty()) nombre = null;
        }

        Page<TipoContacto> result = nombre != null
                ? tipoContactoRepository.findByNombreContainingIgnoreCase(nombre, pageable)
                : tipoContactoRepository.findAllByOrderByIdAsc(pageable);

        List<TipoContactoResponseDto> data = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) result.getTotalElements());
    }

    private TipoContactoResponseDto toResponse(TipoContacto tipoContacto) {
        return new TipoContactoResponseDto(
                tipoContacto.getId(),
                tipoContacto.getNombre(),
                tipoContacto.getCreatedAt(),
                tipoContacto.getUpdatedAt()
        );
    }
}
