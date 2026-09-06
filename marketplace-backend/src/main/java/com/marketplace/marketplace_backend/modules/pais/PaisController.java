package com.marketplace.marketplace_backend.modules.pais;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.pais.dto.PaisCreateRequestDto;
import com.marketplace.marketplace_backend.modules.pais.dto.PaisFilterDto;
import com.marketplace.marketplace_backend.modules.pais.dto.PaisResponseDto;
import com.marketplace.marketplace_backend.modules.pais.dto.PaisUpdateRequestDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/paises")
@RestController
// Endpoints REST para la gestión de paises
public class PaisController {

    private final PaisService paisService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_PAISES')")
    public ResponseEntity<StandardResponseDto<PaisResponseDto>> create(@Valid @RequestBody PaisCreateRequestDto request) {
        StandardResponseDto<PaisResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(paisService.create(request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_PAISES')")
    public ResponseEntity<StandardResponseDto<PaisResponseDto>> update(@PathVariable Long id, @Valid @RequestBody PaisUpdateRequestDto request) {
        StandardResponseDto<PaisResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(paisService.update(id, request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GET_PAISES')")
    public ResponseEntity<StandardResponseDto<PaisResponseDto>> get(@PathVariable Long id) {
        StandardResponseDto<PaisResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(paisService.get(id));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('LIST_PAISES')")
    public ResponseEntity<StandardResponseDto<List<PaisResponseDto>>> findAll(@ModelAttribute PaisFilterDto filter) {
        StandardResponseDto<List<PaisResponseDto>> response = new StandardResponseDto<>();
        var result = paisService.findAll(filter);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_PAISES')")
    public ResponseEntity<StandardResponseDto<Void>> delete(@PathVariable Long id) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        paisService.delete(id);
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
