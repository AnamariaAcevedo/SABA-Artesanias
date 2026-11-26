package com.marketplace.marketplace_backend.modules.tipocontacto;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.tipocontacto.dto.TipoContactoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.tipocontacto.dto.TipoContactoFilterDto;
import com.marketplace.marketplace_backend.modules.tipocontacto.dto.TipoContactoResponseDto;
import com.marketplace.marketplace_backend.modules.tipocontacto.dto.TipoContactoUpdateRequestDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/tipos-contacto")
@RestController
// Endpoints REST para la gestión de tipos de contacto
public class TipoContactoController {

    private final TipoContactoService tipoContactoService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_TIPOS_CONTACTO')")
    public ResponseEntity<StandardResponseDto<TipoContactoResponseDto>> create(@Valid @RequestBody TipoContactoCreateRequestDto request) {
        StandardResponseDto<TipoContactoResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(tipoContactoService.create(request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_TIPOS_CONTACTO')")
    public ResponseEntity<StandardResponseDto<TipoContactoResponseDto>> update(@PathVariable Long id, @Valid @RequestBody TipoContactoUpdateRequestDto request) {
        StandardResponseDto<TipoContactoResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(tipoContactoService.update(id, request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StandardResponseDto<TipoContactoResponseDto>> get(@PathVariable Long id) {
        StandardResponseDto<TipoContactoResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(tipoContactoService.get(id));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<StandardResponseDto<List<TipoContactoResponseDto>>> findAll(@ModelAttribute TipoContactoFilterDto filter) {
        StandardResponseDto<List<TipoContactoResponseDto>> response = new StandardResponseDto<>();
        var result = tipoContactoService.findAll(filter);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_TIPOS_CONTACTO')")
    public ResponseEntity<StandardResponseDto<Void>> delete(@PathVariable Long id) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        tipoContactoService.delete(id);
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
