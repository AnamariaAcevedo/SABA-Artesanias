package com.marketplace.marketplace_backend.modules.direccion;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.barrio.Barrio;
import com.marketplace.marketplace_backend.modules.barrio.BarrioRepository;
import com.marketplace.marketplace_backend.modules.direccion.dto.DireccionCreateRequestDto;
import com.marketplace.marketplace_backend.modules.direccion.dto.DireccionFilterDto;
import com.marketplace.marketplace_backend.modules.direccion.dto.DireccionResponseDto;
import com.marketplace.marketplace_backend.modules.direccion.dto.DireccionUpdateRequestDto;
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
// Implementación de la lógica de negocio para gestionar direcciones
public class DireccionServiceImpl implements DireccionService {

    private final DireccionRepository direccionRepository;
    private final BarrioRepository barrioRepository;

    @Override
    @Transactional
    public DireccionResponseDto create(DireccionCreateRequestDto request) {
        if (request.getNroCasa() == null && (request.getNroDepartamento() == null || request.getNroDepartamento().isBlank())) {
            throw new IllegalArgumentException("Debe indicar el número de casa o el número de departamento");
        }

        Barrio barrio = barrioRepository.findById(request.getIdBarrio())
                .orElseThrow(() -> new EntityNotFoundException("Barrio no encontrado"));

        Direccion direccion = new Direccion();
        direccion.setCalle(request.getCalle());
        direccion.setNroCasa(request.getNroCasa());
        direccion.setNroDepartamento(request.getNroDepartamento());
        direccion.setBarrio(barrio);
        Direccion saved = direccionRepository.save(direccion);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public DireccionResponseDto update(Long id, DireccionUpdateRequestDto request) {
        Direccion direccion = direccionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Dirección no encontrada"));

        if (request.getCalle() != null) {
            direccion.setCalle(request.getCalle());
        }

        if (request.getNroCasa() != null) {
            direccion.setNroCasa(request.getNroCasa());
        }

        if (request.getNroDepartamento() != null) {
            direccion.setNroDepartamento(request.getNroDepartamento());
        }

        if (direccion.getNroCasa() == null && (direccion.getNroDepartamento() == null || direccion.getNroDepartamento().isBlank())) {
            throw new IllegalArgumentException("Debe indicar el número de casa o el número de departamento");
        }

        if (request.getIdBarrio() != null) {
            Barrio barrio = barrioRepository.findById(request.getIdBarrio())
                    .orElseThrow(() -> new EntityNotFoundException("Barrio no encontrado"));
            direccion.setBarrio(barrio);
        }

        Direccion updated = direccionRepository.save(direccion);
        return toResponse(updated);
    }

    @Override
    public DireccionResponseDto get(Long id) {
        Direccion direccion = direccionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Dirección no encontrada"));
        return toResponse(direccion);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Direccion direccion = direccionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Dirección no encontrada"));

        direccion.setDeletedAt(LocalDateTime.now());
        direccionRepository.save(direccion);
    }

    @Override
    public PagedResult<List<DireccionResponseDto>> findAll(DireccionFilterDto filter) {
        int page = filter.getPage();
        int perPage = filter.getPerPage();

        Pageable pageable = PageRequest.of(page - 1, perPage);

        String calle = filter.getCalle();
        if (calle != null) {
            calle = calle.trim();
            if (calle.isEmpty()) calle = null;
        }

        Long idBarrio = filter.getIdBarrio();

        boolean hasCalle = calle != null;
        boolean hasIdBarrio = idBarrio != null;

        Page<Direccion> result;

        if (!hasCalle && !hasIdBarrio) {
            result = direccionRepository.findAllByOrderByIdAsc(pageable);
        } else if (hasCalle && hasIdBarrio) {
            result = direccionRepository.findByCalleContainingIgnoreCaseAndBarrio_Id(calle, idBarrio, pageable);
        } else if (hasCalle) {
            result = direccionRepository.findByCalleContainingIgnoreCase(calle, pageable);
        } else {
            result = direccionRepository.findByBarrio_Id(idBarrio, pageable);
        }

        List<DireccionResponseDto> data = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) result.getTotalElements());
    }

    private DireccionResponseDto toResponse(Direccion direccion) {
        Barrio barrio = direccion.getBarrio();
        var ciudad = barrio.getCiudad();
        var departamento = ciudad.getDepartamento();
        var pais = departamento.getPais();

        return new DireccionResponseDto(
                direccion.getId(),
                direccion.getCalle(),
                direccion.getNroCasa(),
                direccion.getNroDepartamento(),
                barrio.getId(),
                barrio.getNombre(),
                ciudad.getId(),
                ciudad.getNombre(),
                departamento.getId(),
                departamento.getNombre(),
                pais.getId(),
                pais.getNombre(),
                direccion.getCreatedAt(),
                direccion.getUpdatedAt()
        );
    }
}
