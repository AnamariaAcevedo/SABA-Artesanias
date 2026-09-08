package com.marketplace.marketplace_backend.modules.subcategoria;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.subcategoria.dto.SubcategoriaCreateRequestDto;
import com.marketplace.marketplace_backend.modules.subcategoria.dto.SubcategoriaFilterDto;
import com.marketplace.marketplace_backend.modules.subcategoria.dto.SubcategoriaResponseDto;
import com.marketplace.marketplace_backend.modules.subcategoria.dto.SubcategoriaUpdateRequestDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/subcategorias")
@RestController
// Endpoints REST para la gestión de subcategorias
public class SubcategoriaController {

    private final SubcategoriaService subcategoriaService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_SUBCATEGORIAS')")
    public ResponseEntity<StandardResponseDto<SubcategoriaResponseDto>> create(@Valid @RequestBody SubcategoriaCreateRequestDto request) {
        StandardResponseDto<SubcategoriaResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(subcategoriaService.create(request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_SUBCATEGORIAS')")
    public ResponseEntity<StandardResponseDto<SubcategoriaResponseDto>> update(@PathVariable Long id, @Valid @RequestBody SubcategoriaUpdateRequestDto request) {
        StandardResponseDto<SubcategoriaResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(subcategoriaService.update(id, request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StandardResponseDto<SubcategoriaResponseDto>> get(@PathVariable Long id) {
        StandardResponseDto<SubcategoriaResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(subcategoriaService.get(id));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<StandardResponseDto<List<SubcategoriaResponseDto>>> findAll(@ModelAttribute SubcategoriaFilterDto filter) {
        StandardResponseDto<List<SubcategoriaResponseDto>> response = new StandardResponseDto<>();
        var result = subcategoriaService.findAll(filter);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_SUBCATEGORIAS')")
    public ResponseEntity<StandardResponseDto<Void>> delete(@PathVariable Long id) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        subcategoriaService.delete(id);
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
