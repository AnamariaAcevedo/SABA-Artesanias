package com.marketplace.marketplace_backend.modules.productosubcategoria;

import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.productosubcategoria.dto.ProductoSubcategoriaRequestDto;
import com.marketplace.marketplace_backend.modules.productosubcategoria.dto.ProductoSubcategoriaResponseDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@AllArgsConstructor
@RequestMapping("/productos")
@RestController
// Endpoints REST para asignar y revocar las subcategorias de un producto
public class ProductoSubcategoriaController {

    private final ProductoSubcategoriaService productoSubcategoriaService;

    @PostMapping("/{productoId}/subcategorias")
    @PreAuthorize("hasAuthority('ASSIGN_SUBCATEGORIAS')")
    public ResponseEntity<StandardResponseDto<ProductoSubcategoriaResponseDto>> create(
            @PathVariable Long productoId,
            @Valid @RequestBody ProductoSubcategoriaRequestDto request) {
        StandardResponseDto<ProductoSubcategoriaResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(productoSubcategoriaService.create(productoId, request.getSubcategoriaId()));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{productoId}/subcategorias/{subcategoriaId}")
    @PreAuthorize("hasAuthority('REVOKE_SUBCATEGORIAS')")
    public ResponseEntity<StandardResponseDto<Void>> delete(
            @PathVariable Long productoId,
            @PathVariable Long subcategoriaId) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        productoSubcategoriaService.delete(productoId, subcategoriaId);
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
