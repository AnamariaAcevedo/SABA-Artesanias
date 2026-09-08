package com.marketplace.marketplace_backend.modules.imagenproducto;

import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.imagenproducto.dto.ImagenProductoResponseDto;
import lombok.AllArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@AllArgsConstructor
@RestController
// Endpoints REST para subir, listar, obtener y borrar imagenes de productos
public class ImagenProductoController {

    private final ImagenProductoService imagenProductoService;

    @PostMapping(value = "/productos/{productoId}/imagenes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('CREATE_IMAGENES')")
    public ResponseEntity<StandardResponseDto<ImagenProductoResponseDto>> create(
            @PathVariable Long productoId,
            @RequestParam("archivo") MultipartFile archivo) {
        StandardResponseDto<ImagenProductoResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(imagenProductoService.create(productoId, archivo));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    // Publico: es parte de ver el catalogo (las miniaturas/galeria de un producto)
    @GetMapping("/productos/{productoId}/imagenes")
    public ResponseEntity<StandardResponseDto<List<ImagenProductoResponseDto>>> listByProducto(@PathVariable Long productoId) {
        StandardResponseDto<List<ImagenProductoResponseDto>> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(imagenProductoService.listByProducto(productoId));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    // Publico: devuelve el binario de la imagen para usar directo en un <img src="...">
    @GetMapping("/imagenes/{id}")
    public ResponseEntity<byte[]> get(@PathVariable Long id) {
        ImagenProducto imagenProducto = imagenProductoService.get(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(imagenProducto.getContentType()))
                .body(imagenProducto.getImagen());
    }

    @DeleteMapping("/imagenes/{id}")
    @PreAuthorize("hasAuthority('DELETE_IMAGENES')")
    public ResponseEntity<StandardResponseDto<Void>> delete(@PathVariable Long id) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        imagenProductoService.delete(id);
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
