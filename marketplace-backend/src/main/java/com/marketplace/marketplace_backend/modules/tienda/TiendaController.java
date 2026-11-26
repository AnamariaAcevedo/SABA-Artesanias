package com.marketplace.marketplace_backend.modules.tienda;

import org.springframework.security.core.Authentication;
import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.tienda.dto.DatosPagoTiendaResponseDto;
import com.marketplace.marketplace_backend.modules.tienda.dto.TiendaCreateRequestDto;
import com.marketplace.marketplace_backend.modules.tienda.dto.TiendaFilterDto;
import com.marketplace.marketplace_backend.modules.tienda.dto.TiendaResponseDto;
import com.marketplace.marketplace_backend.modules.tienda.dto.TiendaUpdateRequestDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/tiendas")
@RestController
// Endpoints REST para la gestión de tiendas
public class TiendaController {

    private final TiendaService tiendaService;
    private final EstadoTiendaService estadoTiendaService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_TIENDAS')")
    public ResponseEntity<StandardResponseDto<TiendaResponseDto>> create(@Valid @RequestBody TiendaCreateRequestDto request) {
        StandardResponseDto<TiendaResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(tiendaService.create(request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_TIENDAS')")
    public ResponseEntity<StandardResponseDto<TiendaResponseDto>> update(@PathVariable Long id, @Valid @RequestBody TiendaUpdateRequestDto request) {
        StandardResponseDto<TiendaResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(tiendaService.update(id, request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StandardResponseDto<TiendaResponseDto>> get(@PathVariable Long id) {
        StandardResponseDto<TiendaResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(tiendaService.get(id));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    // Publico: un invitado tambien necesita saber a donde transferir para poder comprar.
    @GetMapping("/{id}/datos-pago")
    public ResponseEntity<StandardResponseDto<DatosPagoTiendaResponseDto>> obtenerDatosPago(@PathVariable Long id) {
        StandardResponseDto<DatosPagoTiendaResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(tiendaService.obtenerDatosPago(id));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<StandardResponseDto<List<TiendaResponseDto>>> findAll(
            @ModelAttribute TiendaFilterDto filter,
            Authentication authentication) {
        // El listado publico solo muestra tiendas activas; la administracion ve todas.
        // Se fija aca para que no se pueda cambiar desde la URL.
        filter.setSoloActivas(!tieneAlgunPermiso(authentication, "LIST_TIENDAS", "UPDATE_TIENDAS"));
        StandardResponseDto<List<TiendaResponseDto>> response = new StandardResponseDto<>();
        var result = tiendaService.findAll(filter);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/activar")
    @PreAuthorize("hasAuthority('UPDATE_TIENDAS')")
    public ResponseEntity<StandardResponseDto<TiendaResponseDto>> activar(@PathVariable Long id) {
        return ok(estadoTiendaService.cambiarActivo(id, true));
    }

    @PutMapping("/{id}/desactivar")
    @PreAuthorize("hasAuthority('UPDATE_TIENDAS')")
    public ResponseEntity<StandardResponseDto<TiendaResponseDto>> desactivar(@PathVariable Long id) {
        return ok(estadoTiendaService.cambiarActivo(id, false));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_TIENDAS')")
    public ResponseEntity<StandardResponseDto<Void>> delete(@PathVariable Long id) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        estadoTiendaService.eliminar(id);
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
