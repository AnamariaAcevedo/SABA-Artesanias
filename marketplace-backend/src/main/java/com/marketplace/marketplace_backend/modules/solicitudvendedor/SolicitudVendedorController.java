package com.marketplace.marketplace_backend.modules.solicitudvendedor;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.solicitudvendedor.dto.RechazarSolicitudRequestDto;
import com.marketplace.marketplace_backend.modules.solicitudvendedor.dto.SolicitudVendedorRequestDto;
import com.marketplace.marketplace_backend.modules.solicitudvendedor.dto.SolicitudVendedorResponseDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/solicitudes-vendedor")
@RestController
// Endpoints para solicitar ser vendedor (usuario autenticado) y para que el administrador las revise
public class SolicitudVendedorController {

    private final SolicitudVendedorService solicitudVendedorService;

    @PostMapping
    public ResponseEntity<StandardResponseDto<SolicitudVendedorResponseDto>> crear(@Valid @RequestBody SolicitudVendedorRequestDto request) {
        StandardResponseDto<SolicitudVendedorResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(solicitudVendedorService.crear(request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/mia")
    public ResponseEntity<StandardResponseDto<SolicitudVendedorResponseDto>> obtenerMia() {
        StandardResponseDto<SolicitudVendedorResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(solicitudVendedorService.obtenerMia());
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/mia")
    public ResponseEntity<StandardResponseDto<Void>> eliminarMia() {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        solicitudVendedorService.eliminarMia();
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('LIST_SOLICITUDES_VENDEDOR')")
    public ResponseEntity<StandardResponseDto<List<SolicitudVendedorResponseDto>>> listar(
            @RequestParam(required = false) String estado,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int perPage) {
        StandardResponseDto<List<SolicitudVendedorResponseDto>> response = new StandardResponseDto<>();
        var resultado = solicitudVendedorService.listar(estado, page, perPage);
        response.setSuccess(true);
        response.setData(resultado.data());
        response.setErrors(null);
        response.setPagination(new Pagination(resultado.page(), resultado.perPage(), resultado.total()));
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/aceptar")
    @PreAuthorize("hasAuthority('UPDATE_SOLICITUDES_VENDEDOR')")
    public ResponseEntity<StandardResponseDto<SolicitudVendedorResponseDto>> aceptar(@PathVariable Long id) {
        StandardResponseDto<SolicitudVendedorResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(solicitudVendedorService.aceptar(id));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/rechazar")
    @PreAuthorize("hasAuthority('UPDATE_SOLICITUDES_VENDEDOR')")
    public ResponseEntity<StandardResponseDto<SolicitudVendedorResponseDto>> rechazar(
            @PathVariable Long id,
            @Valid @RequestBody RechazarSolicitudRequestDto request) {
        StandardResponseDto<SolicitudVendedorResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(solicitudVendedorService.rechazar(id, request.getMotivo()));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
