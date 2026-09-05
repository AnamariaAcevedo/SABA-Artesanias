package com.marketplace.marketplace_backend.modules.rol;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.rol.dto.RolCreateRequestDto;
import com.marketplace.marketplace_backend.modules.rol.dto.RolFilterDto;
import com.marketplace.marketplace_backend.modules.rol.dto.RolResponseDto;
import com.marketplace.marketplace_backend.modules.rol.dto.RolUpdateRequestDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/roles")
@RestController
// Endpoints REST para la gestión de roles
public class RolController {

    private final RolService rolService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_ROLES')")
    public ResponseEntity<StandardResponseDto<RolResponseDto>> create(@Valid @RequestBody RolCreateRequestDto request) {
        StandardResponseDto<RolResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(rolService.create(request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_ROLES')")
    public ResponseEntity<StandardResponseDto<RolResponseDto>> update(@PathVariable Long id, @Valid @RequestBody RolUpdateRequestDto request) {
        StandardResponseDto<RolResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(rolService.update(id, request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GET_ROLES')")
    public ResponseEntity<StandardResponseDto<RolResponseDto>> get(@PathVariable Long id) {
        StandardResponseDto<RolResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(rolService.get(id));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('LIST_ROLES')")
    public ResponseEntity<StandardResponseDto<List<RolResponseDto>>> findAll(@ModelAttribute RolFilterDto filter) {
        StandardResponseDto<List<RolResponseDto>> response = new StandardResponseDto<>();
        var result = rolService.findAll(filter);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_ROLES')")
    public ResponseEntity<StandardResponseDto<Void>> delete(@PathVariable Long id) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        rolService.delete(id);
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/options")
    @PreAuthorize("hasAuthority('OPTIONS_ROLES')")
    public ResponseEntity<StandardResponseDto<List<RolResponseDto>>> findAllOptions() {
        StandardResponseDto<List<RolResponseDto>> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(rolService.findAllOptions());
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
