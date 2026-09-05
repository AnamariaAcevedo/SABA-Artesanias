package com.marketplace.marketplace_backend.modules.rolpermiso;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.rolpermiso.dto.RolPermisoFilterDto;
import com.marketplace.marketplace_backend.modules.rolpermiso.dto.RolPermisoRequestDto;
import com.marketplace.marketplace_backend.modules.rolpermiso.dto.RolPermisoResponseDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/roles")
@RestController
// Endpoints REST para asignar, revocar y listar los permisos de un rol
public class RolPermisoController {

    private final RolPermisoService rolPermisoService;

    @PostMapping("/{rolId}/permisos")
    @PreAuthorize("hasAuthority('ASSIGN_PERMISOS')")
    public ResponseEntity<StandardResponseDto<RolPermisoResponseDto>> create(
            @PathVariable Long rolId,
            @Valid @RequestBody RolPermisoRequestDto request) {
        StandardResponseDto<RolPermisoResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(rolPermisoService.create(rolId, request.getPermisoId()));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{rolId}/permisos/{permisoId}")
    @PreAuthorize("hasAuthority('REVOKE_PERMISOS')")
    public ResponseEntity<StandardResponseDto<Void>> delete(
            @PathVariable Long rolId,
            @PathVariable Long permisoId) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        rolPermisoService.delete(rolId, permisoId);
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{rolId}/permisos")
    @PreAuthorize("hasAuthority('LIST_PERMISOS')")
    public ResponseEntity<StandardResponseDto<List<RolPermisoResponseDto>>> list(
            @PathVariable Long rolId,
            @ModelAttribute RolPermisoFilterDto filter) {
        StandardResponseDto<List<RolPermisoResponseDto>> response = new StandardResponseDto<>();
        var result = rolPermisoService.listByRol(rolId, filter);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }
}
