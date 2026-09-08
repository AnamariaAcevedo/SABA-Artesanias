package com.marketplace.marketplace_backend.modules.productosubcategoria;

import com.marketplace.marketplace_backend.modules.producto.Producto;
import com.marketplace.marketplace_backend.modules.producto.ProductoRepository;
import com.marketplace.marketplace_backend.modules.productosubcategoria.dto.ProductoSubcategoriaResponseDto;
import com.marketplace.marketplace_backend.modules.subcategoria.Subcategoria;
import com.marketplace.marketplace_backend.modules.subcategoria.SubcategoriaRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@AllArgsConstructor
@Service
// Implementación de la lógica de negocio para asignar y revocar subcategorias de un producto
public class ProductoSubcategoriaServiceImpl implements ProductoSubcategoriaService {

    private final ProductoSubcategoriaRepository productoSubcategoriaRepository;
    private final ProductoRepository productoRepository;
    private final SubcategoriaRepository subcategoriaRepository;

    @Override
    @Transactional
    public ProductoSubcategoriaResponseDto create(Long productoId, Long subcategoriaId) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));

        Subcategoria subcategoria = subcategoriaRepository.findById(subcategoriaId)
                .orElseThrow(() -> new EntityNotFoundException("Subcategoría no encontrada"));

        if (productoSubcategoriaRepository.existsByProducto_IdAndSubcategoria_Id(productoId, subcategoriaId)) {
            throw new IllegalStateException("La relación ya existe");
        }

        ProductoSubcategoria saved = productoSubcategoriaRepository.save(new ProductoSubcategoria(producto, subcategoria));

        return new ProductoSubcategoriaResponseDto(
                saved.getSubcategoria().getId(),
                saved.getSubcategoria().getNombre()
        );
    }

    @Override
    @Transactional
    public void delete(Long productoId, Long subcategoriaId) {
        productoSubcategoriaRepository.deleteByProducto_IdAndSubcategoria_Id(productoId, subcategoriaId);
    }
}
