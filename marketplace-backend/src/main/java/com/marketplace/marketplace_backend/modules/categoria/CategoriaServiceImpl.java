package com.marketplace.marketplace_backend.modules.categoria;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.categoria.dto.CategoriaCreateRequestDto;
import com.marketplace.marketplace_backend.modules.categoria.dto.CategoriaFilterDto;
import com.marketplace.marketplace_backend.modules.categoria.dto.CategoriaResponseDto;
import com.marketplace.marketplace_backend.modules.categoria.dto.CategoriaUpdateRequestDto;
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
// Implementación de la lógica de negocio para gestionar categorias
public class CategoriaServiceImpl implements CategoriaService {

    private final CategoriaRepository categoriaRepository;

    @Override
    @Transactional
    public CategoriaResponseDto create(CategoriaCreateRequestDto request) {
        categoriaRepository.findByNombreIgnoreCaseAndDeletedAtIsNull(request.getNombre())
                .ifPresent(c -> {
                    throw new IllegalStateException("Ya existe una categoría activa con ese nombre");
                });

        Categoria categoria = new Categoria();
        categoria.setNombre(request.getNombre());
        Categoria saved = categoriaRepository.save(categoria);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public CategoriaResponseDto update(Long id, CategoriaUpdateRequestDto request) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Categoría no encontrada"));

        if (request.getNombre() != null) {
            categoria.setNombre(request.getNombre());
        }

        Categoria updated = categoriaRepository.save(categoria);
        return toResponse(updated);
    }

    @Override
    public CategoriaResponseDto get(Long id) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Categoría no encontrada"));
        return toResponse(categoria);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Categoría no encontrada"));

        categoria.setDeletedAt(LocalDateTime.now());
        categoriaRepository.save(categoria);
    }

    @Override
    public PagedResult<List<CategoriaResponseDto>> findAll(CategoriaFilterDto filter) {
        int page = filter.getPage();
        int perPage = filter.getPerPage();

        Pageable pageable = PageRequest.of(page - 1, perPage);

        String nombre = filter.getNombre();
        if (nombre != null) {
            nombre = nombre.trim();
            if (nombre.isEmpty()) nombre = null;
        }

        Page<Categoria> result = nombre != null
                ? categoriaRepository.findByNombreContainingIgnoreCase(nombre, pageable)
                : categoriaRepository.findAllByOrderByIdAsc(pageable);

        List<CategoriaResponseDto> data = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) result.getTotalElements());
    }

    private CategoriaResponseDto toResponse(Categoria categoria) {
        return new CategoriaResponseDto(
                categoria.getId(),
                categoria.getNombre(),
                categoria.getCreatedAt(),
                categoria.getUpdatedAt()
        );
    }
}
