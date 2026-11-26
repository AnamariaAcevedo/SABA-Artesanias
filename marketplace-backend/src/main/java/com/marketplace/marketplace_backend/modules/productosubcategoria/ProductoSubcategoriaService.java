package com.marketplace.marketplace_backend.modules.productosubcategoria;

import com.marketplace.marketplace_backend.modules.productosubcategoria.dto.ProductoSubcategoriaResponseDto;

// Operaciones de negocio para asignar y revocar subcategorias de un producto
public interface ProductoSubcategoriaService {
    ProductoSubcategoriaResponseDto create(Long productoId, Long subcategoriaId);

    void delete(Long productoId, Long subcategoriaId);
}
