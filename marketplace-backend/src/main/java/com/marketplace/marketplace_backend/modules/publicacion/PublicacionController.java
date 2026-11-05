package com.marketplace.marketplace_backend.modules.publicacion;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.publicacion.dto.PublicacionResponseDto;
import com.marketplace.marketplace_backend.modules.reaccion.ReaccionService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/publicaciones")
@RestController
// Endpoints REST publicos para que los compradores vean publicaciones y reaccionen.
// Crear/editar/borrar una publicacion se hace desde /mi-tienda/publicaciones.
public class PublicacionController {

    private final PublicacionService publicacionService;
    private final ReaccionService reaccionService;

    @GetMapping
    public ResponseEntity<StandardResponseDto<List<PublicacionResponseDto>>> findAll(
            @RequestParam(required = false) Long idTienda,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int perPage) {
        StandardResponseDto<List<PublicacionResponseDto>> response = new StandardResponseDto<>();
        var result = publicacionService.findAllPublicas(idTienda, page, perPage);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StandardResponseDto<PublicacionResponseDto>> get(@PathVariable Long id) {
        return ok(publicacionService.obtenerPublica(id));
    }

    @PostMapping("/{id}/reacciones")
    @PreAuthorize("hasAuthority('CREATE_REACCIONES')")
    public ResponseEntity<StandardResponseDto<Long>> reaccionar(@PathVariable Long id) {
        return ok(reaccionService.crear(id));
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
