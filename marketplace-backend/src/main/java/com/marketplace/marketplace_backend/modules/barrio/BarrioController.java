package com.marketplace.marketplace_backend.modules.barrio;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.barrio.dto.BarrioCreateRequestDto;
import com.marketplace.marketplace_backend.modules.barrio.dto.BarrioFilterDto;
import com.marketplace.marketplace_backend.modules.barrio.dto.BarrioResponseDto;
import com.marketplace.marketplace_backend.modules.barrio.dto.BarrioUpdateRequestDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/barrios")
@RestController
// Endpoints REST para la gestión de barrios
public class BarrioController {

    private final BarrioService barrioService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_BARRIOS')")
    public ResponseEntity<StandardResponseDto<BarrioResponseDto>> create(@Valid @RequestBody BarrioCreateRequestDto request) {
        StandardResponseDto<BarrioResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(barrioService.create(request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_BARRIOS')")
    public ResponseEntity<StandardResponseDto<BarrioResponseDto>> update(@PathVariable Long id, @Valid @RequestBody BarrioUpdateRequestDto request) {
        StandardResponseDto<BarrioResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(barrioService.update(id, request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GET_BARRIOS')")
    public ResponseEntity<StandardResponseDto<BarrioResponseDto>> get(@PathVariable Long id) {
        StandardResponseDto<BarrioResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(barrioService.get(id));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('LIST_BARRIOS')")
    public ResponseEntity<StandardResponseDto<List<BarrioResponseDto>>> findAll(@ModelAttribute BarrioFilterDto filter) {
        StandardResponseDto<List<BarrioResponseDto>> response = new StandardResponseDto<>();
        var result = barrioService.findAll(filter);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_BARRIOS')")
    public ResponseEntity<StandardResponseDto<Void>> delete(@PathVariable Long id) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        barrioService.delete(id);
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
