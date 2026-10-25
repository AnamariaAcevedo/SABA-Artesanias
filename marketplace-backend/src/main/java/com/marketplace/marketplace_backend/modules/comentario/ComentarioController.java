package com.marketplace.marketplace_backend.modules.comentario;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.comentario.dto.ComentarioRequestDto;
import com.marketplace.marketplace_backend.modules.comentario.dto.ComentarioResponseDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RestController
// Endpoints REST publicos para comentar una publicacion y ver sus comentarios.
// Borrar el comentario de otra persona (moderacion) se hace desde /mi-tienda/publicaciones.
public class ComentarioController {

    private final ComentarioService comentarioService;

    @GetMapping("/publicaciones/{publicacionId}/comentarios")
    public ResponseEntity<StandardResponseDto<List<ComentarioResponseDto>>> listar(
            @PathVariable Long publicacionId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int perPage) {
        StandardResponseDto<List<ComentarioResponseDto>> response = new StandardResponseDto<>();
        var resultado = comentarioService.listarPorPublicacion(publicacionId, page, perPage);
        response.setSuccess(true);
        response.setData(resultado.data());
        response.setErrors(null);
        response.setPagination(new Pagination(resultado.page(), resultado.perPage(), resultado.total()));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/publicaciones/{publicacionId}/comentarios")
    @PreAuthorize("hasAuthority('CREATE_COMENTARIOS')")
    public ResponseEntity<StandardResponseDto<ComentarioResponseDto>> crear(
            @PathVariable Long publicacionId,
            @Valid @RequestBody ComentarioRequestDto request) {
        return ok(comentarioService.crear(publicacionId, request));
    }

    @DeleteMapping("/comentarios/{id}")
    @PreAuthorize("hasAuthority('DELETE_COMENTARIOS')")
    public ResponseEntity<StandardResponseDto<Void>> eliminar(@PathVariable Long id) {
        comentarioService.eliminarPropio(id);
        return ok(null);
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
