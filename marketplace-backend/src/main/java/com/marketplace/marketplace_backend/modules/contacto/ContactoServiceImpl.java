package com.marketplace.marketplace_backend.modules.contacto;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.contacto.dto.ContactoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.contacto.dto.ContactoFilterDto;
import com.marketplace.marketplace_backend.modules.contacto.dto.ContactoResponseDto;
import com.marketplace.marketplace_backend.modules.contacto.dto.ContactoUpdateRequestDto;
import com.marketplace.marketplace_backend.modules.tienda.Tienda;
import com.marketplace.marketplace_backend.modules.tienda.TiendaRepository;
import com.marketplace.marketplace_backend.modules.tipocontacto.TipoContacto;
import com.marketplace.marketplace_backend.modules.tipocontacto.TipoContactoRepository;
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
// Implementación de la lógica de negocio para gestionar contactos de tiendas
public class ContactoServiceImpl implements ContactoService {

    private final ContactoRepository contactoRepository;
    private final TiendaRepository tiendaRepository;
    private final TipoContactoRepository tipoContactoRepository;

    @Override
    @Transactional
    public ContactoResponseDto create(ContactoCreateRequestDto request) {
        Tienda tienda = tiendaRepository.findById(request.getIdTienda())
                .orElseThrow(() -> new EntityNotFoundException("Tienda no encontrada"));

        TipoContacto tipoContacto = tipoContactoRepository.findById(request.getIdTipoContacto())
                .orElseThrow(() -> new EntityNotFoundException("Tipo de contacto no encontrado"));

        Contacto contacto = new Contacto();
        contacto.setEnlace(request.getEnlace());
        contacto.setUsuario(request.getUsuario());
        contacto.setNroTelefono(request.getNroTelefono());
        contacto.setTipoContacto(tipoContacto);
        contacto.setTienda(tienda);
        Contacto saved = contactoRepository.save(contacto);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public ContactoResponseDto update(Long id, ContactoUpdateRequestDto request) {
        Contacto contacto = contactoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Contacto no encontrado"));

        if (request.getEnlace() != null) {
            contacto.setEnlace(request.getEnlace());
        }

        if (request.getUsuario() != null) {
            contacto.setUsuario(request.getUsuario());
        }

        if (request.getNroTelefono() != null) {
            contacto.setNroTelefono(request.getNroTelefono());
        }

        if (request.getIdTipoContacto() != null) {
            TipoContacto tipoContacto = tipoContactoRepository.findById(request.getIdTipoContacto())
                    .orElseThrow(() -> new EntityNotFoundException("Tipo de contacto no encontrado"));
            contacto.setTipoContacto(tipoContacto);
        }

        if (request.getIdTienda() != null) {
            Tienda tienda = tiendaRepository.findById(request.getIdTienda())
                    .orElseThrow(() -> new EntityNotFoundException("Tienda no encontrada"));
            contacto.setTienda(tienda);
        }

        Contacto updated = contactoRepository.save(contacto);
        return toResponse(updated);
    }

    @Override
    public ContactoResponseDto get(Long id) {
        Contacto contacto = contactoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Contacto no encontrado"));
        return toResponse(contacto);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Contacto contacto = contactoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Contacto no encontrado"));

        contacto.setDeletedAt(LocalDateTime.now());
        contactoRepository.save(contacto);
    }

    @Override
    public PagedResult<List<ContactoResponseDto>> findAll(ContactoFilterDto filter) {
        int page = filter.getPage();
        int perPage = filter.getPerPage();

        Pageable pageable = PageRequest.of(page - 1, perPage);

        Long idTienda = filter.getIdTienda();
        Long idTipoContacto = filter.getIdTipoContacto();

        Page<Contacto> result;

        if (idTienda != null && idTipoContacto != null) {
            result = contactoRepository.findByTienda_IdAndTipoContacto_Id(idTienda, idTipoContacto, pageable);
        } else if (idTienda != null) {
            result = contactoRepository.findByTienda_Id(idTienda, pageable);
        } else if (idTipoContacto != null) {
            result = contactoRepository.findByTipoContacto_Id(idTipoContacto, pageable);
        } else {
            result = contactoRepository.findAllByOrderByIdAsc(pageable);
        }

        List<ContactoResponseDto> data = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) result.getTotalElements());
    }

    private ContactoResponseDto toResponse(Contacto contacto) {
        return new ContactoResponseDto(
                contacto.getId(),
                contacto.getEnlace(),
                contacto.getUsuario(),
                contacto.getNroTelefono(),
                contacto.getTipoContacto().getId(),
                contacto.getTipoContacto().getNombre(),
                contacto.getTienda().getId(),
                contacto.getTienda().getNombre(),
                contacto.getCreatedAt(),
                contacto.getUpdatedAt()
        );
    }
}
