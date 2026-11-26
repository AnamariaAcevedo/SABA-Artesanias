package com.marketplace.marketplace_backend.modules.categoriasubcategoria;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.categoriasubcategoria.dto.CategoriaSubcategoriaFilterDto;
import com.marketplace.marketplace_backend.modules.categoriasubcategoria.dto.CategoriaSubcategoriaRequestDto;
import com.marketplace.marketplace_backend.modules.categoriasubcategoria.dto.CategoriaSubcategoriaResponseDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/categorias")
@RestController
// Endpoints REST para asignar, revocar y listar las subcategorias de una categoria
public class CategoriaSubcategoriaController {

    private final CategoriaSubcategoriaService categoriaSubcategoriaService;

    @PostMapping("/{categoriaId}/subcategorias")
    @PreAuthorize("hasAuthority('ASSIGN_SUBCATEGORIAS')")
    public ResponseEntity<StandardResponseDto<CategoriaSubcategoriaResponseDto>> create(
            @PathVariable Long categoriaId,
            @Valid @RequestBody CategoriaSubcategoriaRequestDto request) {
        StandardResponseDto<CategoriaSubcategoriaResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(categoriaSubcategoriaService.create(categoriaId, request.getSubcategoriaId()));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{categoriaId}/subcategorias/{subcategoriaId}")
    @PreAuthorize("hasAuthority('REVOKE_SUBCATEGORIAS')")
    public ResponseEntity<StandardResponseDto<Void>> delete(
            @PathVariable Long categoriaId,
            @PathVariable Long subcategoriaId) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        categoriaSubcategoriaService.delete(categoriaId, subcategoriaId);
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    // Publico: el frontend lo usa para armar el arbol de categorias/subcategorias del catalogo
    @GetMapping("/{categoriaId}/subcategorias")
    public ResponseEntity<StandardResponseDto<List<CategoriaSubcategoriaResponseDto>>> list(
            @PathVariable Long categoriaId,
            @ModelAttribute CategoriaSubcategoriaFilterDto filter) {
        StandardResponseDto<List<CategoriaSubcategoriaResponseDto>> response = new StandardResponseDto<>();
        var result = categoriaSubcategoriaService.listByCategoria(categoriaId, filter);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }
}
