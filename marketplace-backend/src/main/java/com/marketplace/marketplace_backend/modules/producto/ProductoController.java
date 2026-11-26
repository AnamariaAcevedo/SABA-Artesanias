package com.marketplace.marketplace_backend.modules.producto;

import org.springframework.security.core.Authentication;
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
    public ResponseEntity<StandardResponseDto<ProductoResponseDto>> get(@PathVariable Long id) {
        StandardResponseDto<ProductoResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(productoService.get(id));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<StandardResponseDto<List<ProductoResponseDto>>> findAll(
            @ModelAttribute ProductoFilterDto filter,
            Authentication authentication) {
        // El catalogo publico solo muestra productos activos; la administracion ve todos.
        // Se fija aca para que no se pueda cambiar desde la URL.
        filter.setSoloActivos(!tieneAlgunPermiso(authentication, "LIST_PRODUCTOS", "UPDATE_PRODUCTOS"));
        StandardResponseDto<List<ProductoResponseDto>> response = new StandardResponseDto<>();
        var result = productoService.findAll(filter);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/activar")
    @PreAuthorize("hasAuthority('UPDATE_PRODUCTOS')")
    public ResponseEntity<StandardResponseDto<ProductoResponseDto>> activar(@PathVariable Long id) {
        return ok(productoService.cambiarActivo(id, true));
    }

    @PutMapping("/{id}/desactivar")
    @PreAuthorize("hasAuthority('UPDATE_PRODUCTOS')")
    public ResponseEntity<StandardResponseDto<ProductoResponseDto>> desactivar(@PathVariable Long id) {
        return ok(productoService.cambiarActivo(id, false));
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

    private static boolean tieneAlgunPermiso(Authentication authentication, String... permisos) {
        if (authentication == null) {
            return false;
        }
        List<String> buscados = List.of(permisos);
        return authentication.getAuthorities().stream()
                .anyMatch(autoridad -> buscados.contains(autoridad.getAuthority()));
    }

    private <T> ResponseEntity<StandardResponseDto<T>> ok(T data) {
        StandardResponseDto<T> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(data);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
