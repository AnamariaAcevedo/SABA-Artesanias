package com.marketplace.marketplace_backend.modules.categoria;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.categoria.dto.CategoriaCreateRequestDto;
import com.marketplace.marketplace_backend.modules.categoria.dto.CategoriaFilterDto;
import com.marketplace.marketplace_backend.modules.categoria.dto.CategoriaResponseDto;
import com.marketplace.marketplace_backend.modules.categoria.dto.CategoriaUpdateRequestDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/categorias")
@RestController
// Endpoints REST para la gestión de categorias
public class CategoriaController {

    private final CategoriaService categoriaService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_CATEGORIAS')")
    public ResponseEntity<StandardResponseDto<CategoriaResponseDto>> create(@Valid @RequestBody CategoriaCreateRequestDto request) {
        StandardResponseDto<CategoriaResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(categoriaService.create(request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_CATEGORIAS')")
    public ResponseEntity<StandardResponseDto<CategoriaResponseDto>> update(@PathVariable Long id, @Valid @RequestBody CategoriaUpdateRequestDto request) {
        StandardResponseDto<CategoriaResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(categoriaService.update(id, request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StandardResponseDto<CategoriaResponseDto>> get(@PathVariable Long id) {
        StandardResponseDto<CategoriaResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(categoriaService.get(id));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<StandardResponseDto<List<CategoriaResponseDto>>> findAll(@ModelAttribute CategoriaFilterDto filter) {
        StandardResponseDto<List<CategoriaResponseDto>> response = new StandardResponseDto<>();
        var result = categoriaService.findAll(filter);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_CATEGORIAS')")
    public ResponseEntity<StandardResponseDto<Void>> delete(@PathVariable Long id) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        categoriaService.delete(id);
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
