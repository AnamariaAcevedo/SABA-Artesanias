package com.marketplace.marketplace_backend.modules.departamento;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.departamento.dto.DepartamentoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.departamento.dto.DepartamentoFilterDto;
import com.marketplace.marketplace_backend.modules.departamento.dto.DepartamentoResponseDto;
import com.marketplace.marketplace_backend.modules.departamento.dto.DepartamentoUpdateRequestDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/departamentos")
@RestController
// Endpoints REST para la gestión de departamentos
public class DepartamentoController {

    private final DepartamentoService departamentoService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_DEPARTAMENTOS')")
    public ResponseEntity<StandardResponseDto<DepartamentoResponseDto>> create(@Valid @RequestBody DepartamentoCreateRequestDto request) {
        StandardResponseDto<DepartamentoResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(departamentoService.create(request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_DEPARTAMENTOS')")
    public ResponseEntity<StandardResponseDto<DepartamentoResponseDto>> update(@PathVariable Long id, @Valid @RequestBody DepartamentoUpdateRequestDto request) {
        StandardResponseDto<DepartamentoResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(departamentoService.update(id, request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StandardResponseDto<DepartamentoResponseDto>> get(@PathVariable Long id) {
        StandardResponseDto<DepartamentoResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(departamentoService.get(id));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<StandardResponseDto<List<DepartamentoResponseDto>>> findAll(@ModelAttribute DepartamentoFilterDto filter) {
        StandardResponseDto<List<DepartamentoResponseDto>> response = new StandardResponseDto<>();
        var result = departamentoService.findAll(filter);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_DEPARTAMENTOS')")
    public ResponseEntity<StandardResponseDto<Void>> delete(@PathVariable Long id) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        departamentoService.delete(id);
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
