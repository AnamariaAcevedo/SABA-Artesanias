package com.marketplace.marketplace_backend.modules.contacto;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.contacto.dto.ContactoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.contacto.dto.ContactoFilterDto;
import com.marketplace.marketplace_backend.modules.contacto.dto.ContactoResponseDto;
import com.marketplace.marketplace_backend.modules.contacto.dto.ContactoUpdateRequestDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/contactos")
@RestController
// Endpoints REST para la gestión de contactos de tiendas
public class ContactoController {

    private final ContactoService contactoService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_CONTACTOS')")
    public ResponseEntity<StandardResponseDto<ContactoResponseDto>> create(@Valid @RequestBody ContactoCreateRequestDto request) {
        StandardResponseDto<ContactoResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(contactoService.create(request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_CONTACTOS')")
    public ResponseEntity<StandardResponseDto<ContactoResponseDto>> update(@PathVariable Long id, @Valid @RequestBody ContactoUpdateRequestDto request) {
        StandardResponseDto<ContactoResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(contactoService.update(id, request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StandardResponseDto<ContactoResponseDto>> get(@PathVariable Long id) {
        StandardResponseDto<ContactoResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(contactoService.get(id));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<StandardResponseDto<List<ContactoResponseDto>>> findAll(@ModelAttribute ContactoFilterDto filter) {
        StandardResponseDto<List<ContactoResponseDto>> response = new StandardResponseDto<>();
        var result = contactoService.findAll(filter);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_CONTACTOS')")
    public ResponseEntity<StandardResponseDto<Void>> delete(@PathVariable Long id) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        contactoService.delete(id);
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
