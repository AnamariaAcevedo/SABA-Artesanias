package com.marketplace.marketplace_backend.modules.pais;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.pais.dto.PaisCreateRequestDto;
import com.marketplace.marketplace_backend.modules.pais.dto.PaisFilterDto;
import com.marketplace.marketplace_backend.modules.pais.dto.PaisResponseDto;
import com.marketplace.marketplace_backend.modules.pais.dto.PaisUpdateRequestDto;
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
// Implementación de la lógica de negocio para gestionar paises
public class PaisServiceImpl implements PaisService {

    private final PaisRepository paisRepository;

    @Override
    @Transactional
    public PaisResponseDto create(PaisCreateRequestDto request) {
        paisRepository.findByNombreIgnoreCaseAndDeletedAtIsNull(request.getNombre())
                .ifPresent(p -> {
                    throw new IllegalStateException("Ya existe un pais activo con ese nombre");
                });

        Pais pais = new Pais();
        pais.setNombre(request.getNombre());
        Pais saved = paisRepository.save(pais);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public PaisResponseDto update(Long id, PaisUpdateRequestDto request) {
        Pais pais = paisRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Pais no encontrado"));

        if (request.getNombre() != null) {
            pais.setNombre(request.getNombre());
        }

        Pais updated = paisRepository.save(pais);
        return toResponse(updated);
    }

    @Override
    public PaisResponseDto get(Long id) {
        Pais pais = paisRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Pais no encontrado"));
        return toResponse(pais);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Pais pais = paisRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Pais no encontrado"));

        pais.setDeletedAt(LocalDateTime.now());
        paisRepository.save(pais);
    }

    @Override
    public PagedResult<List<PaisResponseDto>> findAll(PaisFilterDto filter) {
        int page = filter.getPage();
        int perPage = filter.getPerPage();

        Pageable pageable = PageRequest.of(page - 1, perPage);

        String nombre = filter.getNombre();
        if (nombre != null) {
            nombre = nombre.trim();
            if (nombre.isEmpty()) nombre = null;
        }

        Page<Pais> result = nombre != null
                ? paisRepository.findByNombreContainingIgnoreCase(nombre, pageable)
                : paisRepository.findAllByOrderByIdAsc(pageable);

        List<PaisResponseDto> data = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) result.getTotalElements());
    }

    private PaisResponseDto toResponse(Pais pais) {
        return new PaisResponseDto(
                pais.getId(),
                pais.getNombre(),
                pais.getCreatedAt(),
                pais.getUpdatedAt()
        );
    }
}
