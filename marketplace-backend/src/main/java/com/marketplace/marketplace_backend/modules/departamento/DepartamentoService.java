package com.marketplace.marketplace_backend.modules.departamento;

import java.util.List;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.departamento.dto.DepartamentoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.departamento.dto.DepartamentoFilterDto;
import com.marketplace.marketplace_backend.modules.departamento.dto.DepartamentoResponseDto;
import com.marketplace.marketplace_backend.modules.departamento.dto.DepartamentoUpdateRequestDto;

// Operaciones de negocio disponibles para el módulo Departamento
public interface DepartamentoService {
    DepartamentoResponseDto create(DepartamentoCreateRequestDto request);

    DepartamentoResponseDto update(Long id, DepartamentoUpdateRequestDto request);

    DepartamentoResponseDto get(Long id);

    void delete(Long id);

    PagedResult<List<DepartamentoResponseDto>> findAll(DepartamentoFilterDto filter);
}
