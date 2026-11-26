package com.marketplace.marketplace_backend.modules.archivopublicacion;

import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.archivopublicacion.dto.ArchivoPublicacionResponseDto;
import lombok.AllArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@AllArgsConstructor
@RestController
// Endpoints REST para subir, listar, obtener y borrar archivos de publicaciones
public class ArchivoPublicacionController {

    private final ArchivoPublicacionService archivoPublicacionService;

    @PostMapping(value = "/publicaciones/{publicacionId}/archivos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('CREATE_ARCHIVOS_PUBLICACION')")
    public ResponseEntity<StandardResponseDto<ArchivoPublicacionResponseDto>> create(
            @PathVariable Long publicacionId,
            @RequestParam("archivo") MultipartFile archivo) {
        StandardResponseDto<ArchivoPublicacionResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(archivoPublicacionService.create(publicacionId, archivo));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    // Publico: se muestra junto con la publicacion
    @GetMapping("/publicaciones/{publicacionId}/archivos")
    public ResponseEntity<StandardResponseDto<List<ArchivoPublicacionResponseDto>>> listByPublicacion(@PathVariable Long publicacionId) {
        StandardResponseDto<List<ArchivoPublicacionResponseDto>> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(archivoPublicacionService.listByPublicacion(publicacionId));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    // Publico: devuelve el binario del archivo para usar directo en un <img src="...">
    @GetMapping("/archivos-publicacion/{id}")
    public ResponseEntity<byte[]> get(@PathVariable Long id) {
        ArchivoPublicacion archivoPublicacion = archivoPublicacionService.get(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(archivoPublicacion.getContentType()))
                .body(archivoPublicacion.getArchivo());
    }

    @DeleteMapping("/archivos-publicacion/{id}")
    @PreAuthorize("hasAuthority('DELETE_ARCHIVOS_PUBLICACION')")
    public ResponseEntity<StandardResponseDto<Void>> delete(@PathVariable Long id) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        archivoPublicacionService.delete(id);
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
