package com.marketplace.marketplace_backend.modules.ciudad;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.ciudad.dto.CiudadCreateRequestDto;
import com.marketplace.marketplace_backend.modules.ciudad.dto.CiudadFilterDto;
import com.marketplace.marketplace_backend.modules.ciudad.dto.CiudadResponseDto;
import com.marketplace.marketplace_backend.modules.ciudad.dto.CiudadUpdateRequestDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/ciudades")
@RestController
// Endpoints REST para la gestión de ciudades
public class CiudadController {

    private final CiudadService ciudadService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_CIUDADES')")
    public ResponseEntity<StandardResponseDto<CiudadResponseDto>> create(@Valid @RequestBody CiudadCreateRequestDto request) {
        StandardResponseDto<CiudadResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(ciudadService.create(request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_CIUDADES')")
    public ResponseEntity<StandardResponseDto<CiudadResponseDto>> update(@PathVariable Long id, @Valid @RequestBody CiudadUpdateRequestDto request) {
        StandardResponseDto<CiudadResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(ciudadService.update(id, request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StandardResponseDto<CiudadResponseDto>> get(@PathVariable Long id) {
        StandardResponseDto<CiudadResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(ciudadService.get(id));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<StandardResponseDto<List<CiudadResponseDto>>> findAll(@ModelAttribute CiudadFilterDto filter) {
        StandardResponseDto<List<CiudadResponseDto>> response = new StandardResponseDto<>();
        var result = ciudadService.findAll(filter);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_CIUDADES')")
    public ResponseEntity<StandardResponseDto<Void>> delete(@PathVariable Long id) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        ciudadService.delete(id);
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
