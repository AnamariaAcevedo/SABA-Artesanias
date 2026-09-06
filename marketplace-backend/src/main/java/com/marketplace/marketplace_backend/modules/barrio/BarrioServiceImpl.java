package com.marketplace.marketplace_backend.modules.barrio;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.barrio.dto.BarrioCreateRequestDto;
import com.marketplace.marketplace_backend.modules.barrio.dto.BarrioFilterDto;
import com.marketplace.marketplace_backend.modules.barrio.dto.BarrioResponseDto;
import com.marketplace.marketplace_backend.modules.barrio.dto.BarrioUpdateRequestDto;
import com.marketplace.marketplace_backend.modules.ciudad.Ciudad;
import com.marketplace.marketplace_backend.modules.ciudad.CiudadRepository;
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
// Implementación de la lógica de negocio para gestionar barrios
public class BarrioServiceImpl implements BarrioService {

    private final BarrioRepository barrioRepository;
    private final CiudadRepository ciudadRepository;

    @Override
    @Transactional
    public BarrioResponseDto create(BarrioCreateRequestDto request) {
        Ciudad ciudad = ciudadRepository.findById(request.getIdCiudad())
                .orElseThrow(() -> new EntityNotFoundException("Ciudad no encontrada"));

        barrioRepository.findByNombreIgnoreCaseAndCiudad_IdAndDeletedAtIsNull(request.getNombre(), ciudad.getId())
                .ifPresent(b -> {
                    throw new IllegalStateException("Ya existe un barrio activo con ese nombre en esa ciudad");
                });

        Barrio barrio = new Barrio();
        barrio.setNombre(request.getNombre());
        barrio.setCiudad(ciudad);
        Barrio saved = barrioRepository.save(barrio);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public BarrioResponseDto update(Long id, BarrioUpdateRequestDto request) {
        Barrio barrio = barrioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Barrio no encontrado"));

        if (request.getNombre() != null) {
            barrio.setNombre(request.getNombre());
        }

        if (request.getIdCiudad() != null) {
            Ciudad ciudad = ciudadRepository.findById(request.getIdCiudad())
                    .orElseThrow(() -> new EntityNotFoundException("Ciudad no encontrada"));
            barrio.setCiudad(ciudad);
        }

        Barrio updated = barrioRepository.save(barrio);
        return toResponse(updated);
    }

    @Override
    public BarrioResponseDto get(Long id) {
        Barrio barrio = barrioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Barrio no encontrado"));
        return toResponse(barrio);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Barrio barrio = barrioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Barrio no encontrado"));

        barrio.setDeletedAt(LocalDateTime.now());
        barrioRepository.save(barrio);
    }

    @Override
    public PagedResult<List<BarrioResponseDto>> findAll(BarrioFilterDto filter) {
        int page = filter.getPage();
        int perPage = filter.getPerPage();

        Pageable pageable = PageRequest.of(page - 1, perPage);

        String nombre = filter.getNombre();
        if (nombre != null) {
            nombre = nombre.trim();
            if (nombre.isEmpty()) nombre = null;
        }

        Long idCiudad = filter.getIdCiudad();

        boolean hasNombre = nombre != null;
        boolean hasIdCiudad = idCiudad != null;

        Page<Barrio> result;

        if (!hasNombre && !hasIdCiudad) {
            result = barrioRepository.findAllByOrderByIdAsc(pageable);
        } else if (hasNombre && hasIdCiudad) {
            result = barrioRepository.findByNombreContainingIgnoreCaseAndCiudad_Id(nombre, idCiudad, pageable);
        } else if (hasNombre) {
            result = barrioRepository.findByNombreContainingIgnoreCase(nombre, pageable);
        } else {
            result = barrioRepository.findByCiudad_Id(idCiudad, pageable);
        }

        List<BarrioResponseDto> data = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) result.getTotalElements());
    }

    private BarrioResponseDto toResponse(Barrio barrio) {
        return new BarrioResponseDto(
                barrio.getId(),
                barrio.getNombre(),
                barrio.getCiudad().getId(),
                barrio.getCiudad().getNombre(),
                barrio.getCreatedAt(),
                barrio.getUpdatedAt()
        );
    }
}
