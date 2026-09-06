package com.marketplace.marketplace_backend.modules.ciudad;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.ciudad.dto.CiudadCreateRequestDto;
import com.marketplace.marketplace_backend.modules.ciudad.dto.CiudadFilterDto;
import com.marketplace.marketplace_backend.modules.ciudad.dto.CiudadResponseDto;
import com.marketplace.marketplace_backend.modules.ciudad.dto.CiudadUpdateRequestDto;
import com.marketplace.marketplace_backend.modules.departamento.Departamento;
import com.marketplace.marketplace_backend.modules.departamento.DepartamentoRepository;
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
// Implementación de la lógica de negocio para gestionar ciudades
public class CiudadServiceImpl implements CiudadService {

    private final CiudadRepository ciudadRepository;
    private final DepartamentoRepository departamentoRepository;

    @Override
    @Transactional
    public CiudadResponseDto create(CiudadCreateRequestDto request) {
        Departamento departamento = departamentoRepository.findById(request.getIdDepartamento())
                .orElseThrow(() -> new EntityNotFoundException("Departamento no encontrado"));

        ciudadRepository.findByNombreIgnoreCaseAndDepartamento_IdAndDeletedAtIsNull(request.getNombre(), departamento.getId())
                .ifPresent(c -> {
                    throw new IllegalStateException("Ya existe una ciudad activa con ese nombre en ese departamento");
                });

        Ciudad ciudad = new Ciudad();
        ciudad.setNombre(request.getNombre());
        ciudad.setDepartamento(departamento);
        Ciudad saved = ciudadRepository.save(ciudad);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public CiudadResponseDto update(Long id, CiudadUpdateRequestDto request) {
        Ciudad ciudad = ciudadRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Ciudad no encontrada"));

        if (request.getNombre() != null) {
            ciudad.setNombre(request.getNombre());
        }

        if (request.getIdDepartamento() != null) {
            Departamento departamento = departamentoRepository.findById(request.getIdDepartamento())
                    .orElseThrow(() -> new EntityNotFoundException("Departamento no encontrado"));
            ciudad.setDepartamento(departamento);
        }

        Ciudad updated = ciudadRepository.save(ciudad);
        return toResponse(updated);
    }

    @Override
    public CiudadResponseDto get(Long id) {
        Ciudad ciudad = ciudadRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Ciudad no encontrada"));
        return toResponse(ciudad);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Ciudad ciudad = ciudadRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Ciudad no encontrada"));

        ciudad.setDeletedAt(LocalDateTime.now());
        ciudadRepository.save(ciudad);
    }

    @Override
    public PagedResult<List<CiudadResponseDto>> findAll(CiudadFilterDto filter) {
        int page = filter.getPage();
        int perPage = filter.getPerPage();

        Pageable pageable = PageRequest.of(page - 1, perPage);

        String nombre = filter.getNombre();
        if (nombre != null) {
            nombre = nombre.trim();
            if (nombre.isEmpty()) nombre = null;
        }

        Long idDepartamento = filter.getIdDepartamento();

        boolean hasNombre = nombre != null;
        boolean hasIdDepartamento = idDepartamento != null;

        Page<Ciudad> result;

        if (!hasNombre && !hasIdDepartamento) {
            result = ciudadRepository.findAllByOrderByIdAsc(pageable);
        } else if (hasNombre && hasIdDepartamento) {
            result = ciudadRepository.findByNombreContainingIgnoreCaseAndDepartamento_Id(nombre, idDepartamento, pageable);
        } else if (hasNombre) {
            result = ciudadRepository.findByNombreContainingIgnoreCase(nombre, pageable);
        } else {
            result = ciudadRepository.findByDepartamento_Id(idDepartamento, pageable);
        }

        List<CiudadResponseDto> data = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) result.getTotalElements());
    }

    private CiudadResponseDto toResponse(Ciudad ciudad) {
        return new CiudadResponseDto(
                ciudad.getId(),
                ciudad.getNombre(),
                ciudad.getDepartamento().getId(),
                ciudad.getDepartamento().getNombre(),
                ciudad.getCreatedAt(),
                ciudad.getUpdatedAt()
        );
    }
}
