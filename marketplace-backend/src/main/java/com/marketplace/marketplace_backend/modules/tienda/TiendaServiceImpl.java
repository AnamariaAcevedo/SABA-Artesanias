package com.marketplace.marketplace_backend.modules.tienda;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.direccion.Direccion;
import com.marketplace.marketplace_backend.modules.direccion.DireccionRepository;
import com.marketplace.marketplace_backend.modules.tienda.dto.TiendaCreateRequestDto;
import com.marketplace.marketplace_backend.modules.tienda.dto.TiendaFilterDto;
import com.marketplace.marketplace_backend.modules.tienda.dto.TiendaResponseDto;
import com.marketplace.marketplace_backend.modules.tienda.dto.TiendaUpdateRequestDto;
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
// Implementación de la lógica de negocio para gestionar tiendas
public class TiendaServiceImpl implements TiendaService {

    private final TiendaRepository tiendaRepository;
    private final DireccionRepository direccionRepository;

    @Override
    @Transactional
    public TiendaResponseDto create(TiendaCreateRequestDto request) {
        Direccion direccion = direccionRepository.findById(request.getIdDireccion())
                .orElseThrow(() -> new EntityNotFoundException("Dirección no encontrada"));

        Tienda tienda = new Tienda();
        tienda.setNombre(request.getNombre());
        tienda.setDescripcion(request.getDescripcion());
        tienda.setDireccion(direccion);
        Tienda saved = tiendaRepository.save(tienda);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public TiendaResponseDto update(Long id, TiendaUpdateRequestDto request) {
        Tienda tienda = tiendaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tienda no encontrada"));

        if (request.getNombre() != null) {
            tienda.setNombre(request.getNombre());
        }

        if (request.getDescripcion() != null) {
            tienda.setDescripcion(request.getDescripcion());
        }

        if (request.getIdDireccion() != null) {
            Direccion direccion = direccionRepository.findById(request.getIdDireccion())
                    .orElseThrow(() -> new EntityNotFoundException("Dirección no encontrada"));
            tienda.setDireccion(direccion);
        }

        Tienda updated = tiendaRepository.save(tienda);
        return toResponse(updated);
    }

    @Override
    public TiendaResponseDto get(Long id) {
        Tienda tienda = tiendaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tienda no encontrada"));
        return toResponse(tienda);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Tienda tienda = tiendaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tienda no encontrada"));

        tienda.setDeletedAt(LocalDateTime.now());
        tiendaRepository.save(tienda);
    }

    @Override
    public PagedResult<List<TiendaResponseDto>> findAll(TiendaFilterDto filter) {
        int page = filter.getPage();
        int perPage = filter.getPerPage();

        Pageable pageable = PageRequest.of(page - 1, perPage);

        String nombre = filter.getNombre();
        if (nombre != null) {
            nombre = nombre.trim();
            if (nombre.isEmpty()) nombre = null;
        }

        Page<Tienda> result = nombre != null
                ? tiendaRepository.findByNombreContainingIgnoreCase(nombre, pageable)
                : tiendaRepository.findAllByOrderByIdAsc(pageable);

        List<TiendaResponseDto> data = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) result.getTotalElements());
    }

    private TiendaResponseDto toResponse(Tienda tienda) {
        return new TiendaResponseDto(
                tienda.getId(),
                tienda.getNombre(),
                tienda.getDescripcion(),
                tienda.getDireccion().getId(),
                tienda.getDireccion().getNombre(),
                tienda.getCreatedAt(),
                tienda.getUpdatedAt()
        );
    }
}
