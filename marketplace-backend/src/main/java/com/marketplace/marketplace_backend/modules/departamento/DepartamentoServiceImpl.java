package com.marketplace.marketplace_backend.modules.departamento;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.departamento.dto.DepartamentoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.departamento.dto.DepartamentoFilterDto;
import com.marketplace.marketplace_backend.modules.departamento.dto.DepartamentoResponseDto;
import com.marketplace.marketplace_backend.modules.departamento.dto.DepartamentoUpdateRequestDto;
import com.marketplace.marketplace_backend.modules.pais.Pais;
import com.marketplace.marketplace_backend.modules.pais.PaisRepository;
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
// Implementación de la lógica de negocio para gestionar departamentos
public class DepartamentoServiceImpl implements DepartamentoService {

    private final DepartamentoRepository departamentoRepository;
    private final PaisRepository paisRepository;

    @Override
    @Transactional
    public DepartamentoResponseDto create(DepartamentoCreateRequestDto request) {
        Pais pais = paisRepository.findById(request.getIdPais())
                .orElseThrow(() -> new EntityNotFoundException("Pais no encontrado"));

        departamentoRepository.findByNombreIgnoreCaseAndPais_IdAndDeletedAtIsNull(request.getNombre(), pais.getId())
                .ifPresent(d -> {
                    throw new IllegalStateException("Ya existe un departamento activo con ese nombre en ese pais");
                });

        Departamento departamento = new Departamento();
        departamento.setNombre(request.getNombre());
        departamento.setPais(pais);
        Departamento saved = departamentoRepository.save(departamento);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public DepartamentoResponseDto update(Long id, DepartamentoUpdateRequestDto request) {
        Departamento departamento = departamentoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Departamento no encontrado"));

        if (request.getNombre() != null) {
            departamento.setNombre(request.getNombre());
        }

        if (request.getIdPais() != null) {
            Pais pais = paisRepository.findById(request.getIdPais())
                    .orElseThrow(() -> new EntityNotFoundException("Pais no encontrado"));
            departamento.setPais(pais);
        }

        Departamento updated = departamentoRepository.save(departamento);
        return toResponse(updated);
    }

    @Override
    public DepartamentoResponseDto get(Long id) {
        Departamento departamento = departamentoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Departamento no encontrado"));
        return toResponse(departamento);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Departamento departamento = departamentoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Departamento no encontrado"));

        departamento.setDeletedAt(LocalDateTime.now());
        departamentoRepository.save(departamento);
    }

    @Override
    public PagedResult<List<DepartamentoResponseDto>> findAll(DepartamentoFilterDto filter) {
        int page = filter.getPage();
        int perPage = filter.getPerPage();

        Pageable pageable = PageRequest.of(page - 1, perPage);

        String nombre = filter.getNombre();
        if (nombre != null) {
            nombre = nombre.trim();
            if (nombre.isEmpty()) nombre = null;
        }

        Long idPais = filter.getIdPais();

        boolean hasNombre = nombre != null;
        boolean hasIdPais = idPais != null;

        Page<Departamento> result;

        if (!hasNombre && !hasIdPais) {
            result = departamentoRepository.findAllByOrderByIdAsc(pageable);
        } else if (hasNombre && hasIdPais) {
            result = departamentoRepository.findByNombreContainingIgnoreCaseAndPais_Id(nombre, idPais, pageable);
        } else if (hasNombre) {
            result = departamentoRepository.findByNombreContainingIgnoreCase(nombre, pageable);
        } else {
            result = departamentoRepository.findByPais_Id(idPais, pageable);
        }

        List<DepartamentoResponseDto> data = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) result.getTotalElements());
    }

    private DepartamentoResponseDto toResponse(Departamento departamento) {
        return new DepartamentoResponseDto(
                departamento.getId(),
                departamento.getNombre(),
                departamento.getPais().getId(),
                departamento.getPais().getNombre(),
                departamento.getCreatedAt(),
                departamento.getUpdatedAt()
        );
    }
}
