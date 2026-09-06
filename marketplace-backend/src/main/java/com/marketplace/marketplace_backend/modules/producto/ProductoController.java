package com.marketplace.marketplace_backend.modules.producto;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoFilterDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoResponseDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoUpdateRequestDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/productos")
@RestController
// Endpoints REST para la gestión de productos
public class ProductoController {

    private final ProductoService productoService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_PRODUCTOS')")
    public ResponseEntity<StandardResponseDto<ProductoResponseDto>> create(@Valid @RequestBody ProductoCreateRequestDto request) {
        StandardResponseDto<ProductoResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(productoService.create(request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_PRODUCTOS')")
    public ResponseEntity<StandardResponseDto<ProductoResponseDto>> update(@PathVariable Long id, @Valid @RequestBody ProductoUpdateRequestDto request) {
        StandardResponseDto<ProductoResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(productoService.update(id, request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GET_PRODUCTOS')")
    public ResponseEntity<StandardResponseDto<ProductoResponseDto>> get(@PathVariable Long id) {
        StandardResponseDto<ProductoResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(productoService.get(id));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('LIST_PRODUCTOS')")
    public ResponseEntity<StandardResponseDto<List<ProductoResponseDto>>> findAll(@ModelAttribute ProductoFilterDto filter) {
        StandardResponseDto<List<ProductoResponseDto>> response = new StandardResponseDto<>();
        var result = productoService.findAll(filter);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_PRODUCTOS')")
    public ResponseEntity<StandardResponseDto<Void>> delete(@PathVariable Long id) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        productoService.delete(id);
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
