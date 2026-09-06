package com.marketplace.marketplace_backend.modules.direccion;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.direccion.dto.DireccionCreateRequestDto;
import com.marketplace.marketplace_backend.modules.direccion.dto.DireccionFilterDto;
import com.marketplace.marketplace_backend.modules.direccion.dto.DireccionResponseDto;
import com.marketplace.marketplace_backend.modules.direccion.dto.DireccionUpdateRequestDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/direcciones")
@RestController
// Endpoints REST para la gestión de direcciones
public class DireccionController {

    private final DireccionService direccionService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_DIRECCIONES')")
    public ResponseEntity<StandardResponseDto<DireccionResponseDto>> create(@Valid @RequestBody DireccionCreateRequestDto request) {
        StandardResponseDto<DireccionResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(direccionService.create(request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_DIRECCIONES')")
    public ResponseEntity<StandardResponseDto<DireccionResponseDto>> update(@PathVariable Long id, @Valid @RequestBody DireccionUpdateRequestDto request) {
        StandardResponseDto<DireccionResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(direccionService.update(id, request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GET_DIRECCIONES')")
    public ResponseEntity<StandardResponseDto<DireccionResponseDto>> get(@PathVariable Long id) {
        StandardResponseDto<DireccionResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(direccionService.get(id));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('LIST_DIRECCIONES')")
    public ResponseEntity<StandardResponseDto<List<DireccionResponseDto>>> findAll(@ModelAttribute DireccionFilterDto filter) {
        StandardResponseDto<List<DireccionResponseDto>> response = new StandardResponseDto<>();
        var result = direccionService.findAll(filter);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_DIRECCIONES')")
    public ResponseEntity<StandardResponseDto<Void>> delete(@PathVariable Long id) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        direccionService.delete(id);
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
