package com.marketplace.marketplace_backend.modules.categoriasubcategoria;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.categoria.Categoria;
import com.marketplace.marketplace_backend.modules.categoria.CategoriaRepository;
import com.marketplace.marketplace_backend.modules.categoriasubcategoria.dto.CategoriaSubcategoriaFilterDto;
import com.marketplace.marketplace_backend.modules.categoriasubcategoria.dto.CategoriaSubcategoriaResponseDto;
import com.marketplace.marketplace_backend.modules.subcategoria.Subcategoria;
import com.marketplace.marketplace_backend.modules.subcategoria.SubcategoriaRepository;
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
// Implementación de la lógica de negocio para asignar y consultar subcategorias de una categoria
public class CategoriaSubcategoriaServiceImpl implements CategoriaSubcategoriaService {

    private final CategoriaSubcategoriaRepository categoriaSubcategoriaRepository;
    private final CategoriaRepository categoriaRepository;
    private final SubcategoriaRepository subcategoriaRepository;

    @Override
    @Transactional
    public CategoriaSubcategoriaResponseDto create(Long categoriaId, Long subcategoriaId) {
        Categoria categoria = categoriaRepository.findById(categoriaId)
                .orElseThrow(() -> new EntityNotFoundException("Categoría no encontrada"));

        Subcategoria subcategoria = subcategoriaRepository.findById(subcategoriaId)
                .orElseThrow(() -> new EntityNotFoundException("Subcategoría no encontrada"));

        if (categoriaSubcategoriaRepository.existsByCategoria_IdAndSubcategoria_Id(categoriaId, subcategoriaId)) {
            throw new IllegalStateException("La relación ya existe");
        }

        CategoriaSubcategoria saved = categoriaSubcategoriaRepository.save(new CategoriaSubcategoria(categoria, subcategoria));

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long categoriaId, Long subcategoriaId) {
        categoriaSubcategoriaRepository.deleteByCategoria_IdAndSubcategoria_Id(categoriaId, subcategoriaId);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResult<List<CategoriaSubcategoriaResponseDto>> listByCategoria(Long categoriaId, CategoriaSubcategoriaFilterDto filter) {
        if (!categoriaRepository.existsById(categoriaId)) {
            throw new EntityNotFoundException("Categoría no encontrada");
        }

        int page = Math.max(filter.getPage(), 1);
        int perPage = Math.max(filter.getPerPage(), 1);

        Pageable pageable = PageRequest.of(page - 1, perPage);

        Page<CategoriaSubcategoria> result = categoriaSubcategoriaRepository.findByCategoria_Id(categoriaId, pageable);

        List<CategoriaSubcategoriaResponseDto> data = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) result.getTotalElements());
    }

    private CategoriaSubcategoriaResponseDto toResponse(CategoriaSubcategoria entity) {
        return new CategoriaSubcategoriaResponseDto(
                entity.getSubcategoria().getId(),
                entity.getSubcategoria().getNombre()
        );
    }
}
