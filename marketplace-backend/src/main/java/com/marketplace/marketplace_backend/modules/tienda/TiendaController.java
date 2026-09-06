package com.marketplace.marketplace_backend.modules.tienda;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.tienda.dto.TiendaCreateRequestDto;
import com.marketplace.marketplace_backend.modules.tienda.dto.TiendaFilterDto;
import com.marketplace.marketplace_backend.modules.tienda.dto.TiendaResponseDto;
import com.marketplace.marketplace_backend.modules.tienda.dto.TiendaUpdateRequestDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/tiendas")
@RestController
// Endpoints REST para la gestión de tiendas
public class TiendaController {

    private final TiendaService tiendaService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_TIENDAS')")
    public ResponseEntity<StandardResponseDto<TiendaResponseDto>> create(@Valid @RequestBody TiendaCreateRequestDto request) {
        StandardResponseDto<TiendaResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(tiendaService.create(request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_TIENDAS')")
    public ResponseEntity<StandardResponseDto<TiendaResponseDto>> update(@PathVariable Long id, @Valid @RequestBody TiendaUpdateRequestDto request) {
        StandardResponseDto<TiendaResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(tiendaService.update(id, request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GET_TIENDAS')")
    public ResponseEntity<StandardResponseDto<TiendaResponseDto>> get(@PathVariable Long id) {
        StandardResponseDto<TiendaResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(tiendaService.get(id));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('LIST_TIENDAS')")
    public ResponseEntity<StandardResponseDto<List<TiendaResponseDto>>> findAll(@ModelAttribute TiendaFilterDto filter) {
        StandardResponseDto<List<TiendaResponseDto>> response = new StandardResponseDto<>();
        var result = tiendaService.findAll(filter);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_TIENDAS')")
    public ResponseEntity<StandardResponseDto<Void>> delete(@PathVariable Long id) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        tiendaService.delete(id);
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
