package com.marketplace.marketplace_backend.modules.permiso;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.permiso.dto.PermisoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.permiso.dto.PermisoFilterDto;
import com.marketplace.marketplace_backend.modules.permiso.dto.PermisoResponseDto;
import com.marketplace.marketplace_backend.modules.permiso.dto.PermisoUpdateRequestDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/permisos")
@RestController
// Endpoints REST para la gestión de permisos
public class PermisoController {

    private final PermisoService permisoService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_PERMISOS')")
    public ResponseEntity<StandardResponseDto<PermisoResponseDto>> create(@Valid @RequestBody PermisoCreateRequestDto request) {
        StandardResponseDto<PermisoResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(permisoService.create(request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_PERMISOS')")
    public ResponseEntity<StandardResponseDto<PermisoResponseDto>> update(@PathVariable Long id, @Valid @RequestBody PermisoUpdateRequestDto request) {
        StandardResponseDto<PermisoResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(permisoService.update(id, request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GET_PERMISOS')")
    public ResponseEntity<StandardResponseDto<PermisoResponseDto>> get(@PathVariable Long id) {
        StandardResponseDto<PermisoResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(permisoService.get(id));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('LIST_PERMISOS')")
    public ResponseEntity<StandardResponseDto<List<PermisoResponseDto>>> findAll(@ModelAttribute PermisoFilterDto filter) {
        StandardResponseDto<List<PermisoResponseDto>> response = new StandardResponseDto<>();
        var result = permisoService.findAll(filter);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_PERMISOS')")
    public ResponseEntity<StandardResponseDto<Void>> delete(@PathVariable Long id) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        permisoService.delete(id);
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/options")
    @PreAuthorize("hasAuthority('OPTIONS_PERMISOS')")
    public ResponseEntity<StandardResponseDto<List<PermisoResponseDto>>> findAllOptions() {
        StandardResponseDto<List<PermisoResponseDto>> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(permisoService.findAllOptions());
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
