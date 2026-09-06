package com.marketplace.marketplace_backend.modules.producto;

import java.util.List;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoFilterDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoResponseDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoUpdateRequestDto;

// Operaciones de negocio disponibles para el módulo Producto
public interface ProductoService {
    ProductoResponseDto create(ProductoCreateRequestDto request);

    ProductoResponseDto update(Long id, ProductoUpdateRequestDto request);

    ProductoResponseDto get(Long id);

    void delete(Long id);

    PagedResult<List<ProductoResponseDto>> findAll(ProductoFilterDto filter);
}
