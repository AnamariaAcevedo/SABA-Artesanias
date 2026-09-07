package com.marketplace.marketplace_backend.modules.subcategoria;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.subcategoria.dto.SubcategoriaCreateRequestDto;
import com.marketplace.marketplace_backend.modules.subcategoria.dto.SubcategoriaFilterDto;
import com.marketplace.marketplace_backend.modules.subcategoria.dto.SubcategoriaResponseDto;
import com.marketplace.marketplace_backend.modules.subcategoria.dto.SubcategoriaUpdateRequestDto;
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
// Implementación de la lógica de negocio para gestionar subcategorias
public class SubcategoriaServiceImpl implements SubcategoriaService {

    private final SubcategoriaRepository subcategoriaRepository;

    @Override
    @Transactional
    public SubcategoriaResponseDto create(SubcategoriaCreateRequestDto request) {
        subcategoriaRepository.findByNombreIgnoreCaseAndDeletedAtIsNull(request.getNombre())
                .ifPresent(s -> {
                    throw new IllegalStateException("Ya existe una subcategoría activa con ese nombre");
                });

        Subcategoria subcategoria = new Subcategoria();
        subcategoria.setNombre(request.getNombre());
        Subcategoria saved = subcategoriaRepository.save(subcategoria);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public SubcategoriaResponseDto update(Long id, SubcategoriaUpdateRequestDto request) {
        Subcategoria subcategoria = subcategoriaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Subcategoría no encontrada"));

        if (request.getNombre() != null) {
            subcategoria.setNombre(request.getNombre());
        }

        Subcategoria updated = subcategoriaRepository.save(subcategoria);
        return toResponse(updated);
    }

    @Override
    public SubcategoriaResponseDto get(Long id) {
        Subcategoria subcategoria = subcategoriaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Subcategoría no encontrada"));
        return toResponse(subcategoria);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Subcategoria subcategoria = subcategoriaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Subcategoría no encontrada"));

        subcategoria.setDeletedAt(LocalDateTime.now());
        subcategoriaRepository.save(subcategoria);
    }

    @Override
    public PagedResult<List<SubcategoriaResponseDto>> findAll(SubcategoriaFilterDto filter) {
        int page = filter.getPage();
        int perPage = filter.getPerPage();

        Pageable pageable = PageRequest.of(page - 1, perPage);

        String nombre = filter.getNombre();
        if (nombre != null) {
            nombre = nombre.trim();
            if (nombre.isEmpty()) nombre = null;
        }

        Page<Subcategoria> result = nombre != null
                ? subcategoriaRepository.findByNombreContainingIgnoreCase(nombre, pageable)
                : subcategoriaRepository.findAllByOrderByIdAsc(pageable);

        List<SubcategoriaResponseDto> data = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) result.getTotalElements());
    }

    private SubcategoriaResponseDto toResponse(Subcategoria subcategoria) {
        return new SubcategoriaResponseDto(
                subcategoria.getId(),
                subcategoria.getNombre(),
                subcategoria.getCreatedAt(),
                subcategoria.getUpdatedAt()
        );
    }
}
