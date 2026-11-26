package com.marketplace.marketplace_backend.modules.contacto;

import java.util.List;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.contacto.dto.ContactoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.contacto.dto.ContactoFilterDto;
import com.marketplace.marketplace_backend.modules.contacto.dto.ContactoResponseDto;
import com.marketplace.marketplace_backend.modules.contacto.dto.ContactoUpdateRequestDto;

// Operaciones de negocio disponibles para el módulo Contacto
public interface ContactoService {
    ContactoResponseDto create(ContactoCreateRequestDto request);

    ContactoResponseDto update(Long id, ContactoUpdateRequestDto request);

    ContactoResponseDto get(Long id);

    void delete(Long id);

    PagedResult<List<ContactoResponseDto>> findAll(ContactoFilterDto filter);
}
