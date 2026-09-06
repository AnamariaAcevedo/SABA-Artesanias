package com.marketplace.marketplace_backend.modules.producto;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoFilterDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoResponseDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoUpdateRequestDto;
import com.marketplace.marketplace_backend.modules.tienda.Tienda;
import com.marketplace.marketplace_backend.modules.tienda.TiendaRepository;
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
// Implementación de la lógica de negocio para gestionar productos
public class ProductoServiceImpl implements ProductoService {

    private final ProductoRepository productoRepository;
    private final TiendaRepository tiendaRepository;

    @Override
    @Transactional
    public ProductoResponseDto create(ProductoCreateRequestDto request) {
        Tienda tienda = tiendaRepository.findById(request.getIdTienda())
                .orElseThrow(() -> new EntityNotFoundException("Tienda no encontrada"));

        Producto producto = new Producto();
        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setPrecio(request.getPrecio());
        producto.setPuntuacion(request.getPuntuacion());
        producto.setDescuento(request.getDescuento());
        producto.setCantidadDisponible(request.getCantidadDisponible());
        producto.setTienda(tienda);
        Producto saved = productoRepository.save(producto);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public ProductoResponseDto update(Long id, ProductoUpdateRequestDto request) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));

        if (request.getNombre() != null) {
            producto.setNombre(request.getNombre());
        }

        if (request.getDescripcion() != null) {
            producto.setDescripcion(request.getDescripcion());
        }

        if (request.getPrecio() != null) {
            producto.setPrecio(request.getPrecio());
        }

        if (request.getPuntuacion() != null) {
            producto.setPuntuacion(request.getPuntuacion());
        }

        if (request.getDescuento() != null) {
            producto.setDescuento(request.getDescuento());
        }

        if (request.getCantidadDisponible() != null) {
            producto.setCantidadDisponible(request.getCantidadDisponible());
        }

        if (request.getIdTienda() != null) {
            Tienda tienda = tiendaRepository.findById(request.getIdTienda())
                    .orElseThrow(() -> new EntityNotFoundException("Tienda no encontrada"));
            producto.setTienda(tienda);
        }

        Producto updated = productoRepository.save(producto);
        return toResponse(updated);
    }

    @Override
    public ProductoResponseDto get(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));
        return toResponse(producto);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));

        producto.setDeletedAt(LocalDateTime.now());
        productoRepository.save(producto);
    }

    @Override
    public PagedResult<List<ProductoResponseDto>> findAll(ProductoFilterDto filter) {
        int page = filter.getPage();
        int perPage = filter.getPerPage();

        Pageable pageable = PageRequest.of(page - 1, perPage);

        String nombre = filter.getNombre();
        if (nombre != null) {
            nombre = nombre.trim();
            if (nombre.isEmpty()) nombre = null;
        }

        Long idTienda = filter.getIdTienda();

        boolean hasNombre = nombre != null;
        boolean hasIdTienda = idTienda != null;

        Page<Producto> result;

        if (!hasNombre && !hasIdTienda) {
            result = productoRepository.findAllByOrderByIdAsc(pageable);
        } else if (hasNombre && hasIdTienda) {
            result = productoRepository.findByNombreContainingIgnoreCaseAndTienda_Id(nombre, idTienda, pageable);
        } else if (hasNombre) {
            result = productoRepository.findByNombreContainingIgnoreCase(nombre, pageable);
        } else {
            result = productoRepository.findByTienda_Id(idTienda, pageable);
        }

        List<ProductoResponseDto> data = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) result.getTotalElements());
    }

    private ProductoResponseDto toResponse(Producto producto) {
        return new ProductoResponseDto(
                producto.getId(),
                producto.getNombre(),
                producto.getDescripcion(),
                producto.getPrecio(),
                producto.getPuntuacion(),
                producto.getDescuento(),
                producto.getCantidadDisponible(),
                producto.getTienda().getId(),
                producto.getTienda().getNombre(),
                producto.getCreatedAt(),
                producto.getUpdatedAt()
        );
    }
}
