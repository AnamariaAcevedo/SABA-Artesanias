package com.marketplace.marketplace_backend.modules.imagenproducto;

import com.marketplace.marketplace_backend.modules.imagenproducto.dto.ImagenProductoResponseDto;
import com.marketplace.marketplace_backend.modules.producto.Producto;
import com.marketplace.marketplace_backend.modules.producto.ProductoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@AllArgsConstructor
@Service
// Implementación de la lógica de negocio para subir, listar, obtener y borrar imagenes de productos
public class ImagenProductoServiceImpl implements ImagenProductoService {

    private static final Set<String> TIPOS_PERMITIDOS = Set.of("image/png", "image/jpeg");

    private final ImagenProductoRepository imagenProductoRepository;
    private final ProductoRepository productoRepository;

    @Override
    @Transactional
    public ImagenProductoResponseDto create(Long idProducto, MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new IllegalArgumentException("El archivo no puede estar vacío");
        }

        String contentType = archivo.getContentType();
        if (!TIPOS_PERMITIDOS.contains(contentType)) {
            throw new IllegalArgumentException("Solo se permiten imágenes PNG o JPG");
        }

        Producto producto = productoRepository.findById(idProducto)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));

        ImagenProducto imagenProducto = new ImagenProducto();
        imagenProducto.setContentType(contentType);
        imagenProducto.setProducto(producto);
        try {
            imagenProducto.setImagen(archivo.getBytes());
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer el archivo", e);
        }

        ImagenProducto saved = imagenProductoRepository.save(imagenProducto);
        return toResponse(saved);
    }

    @Override
    public List<ImagenProductoResponseDto> listByProducto(Long idProducto) {
        if (!productoRepository.existsById(idProducto)) {
            throw new EntityNotFoundException("Producto no encontrado");
        }

        return imagenProductoRepository.findByProducto_IdOrderByIdAsc(idProducto).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ImagenProducto get(Long id) {
        return imagenProductoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Imagen no encontrada"));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        ImagenProducto imagenProducto = imagenProductoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Imagen no encontrada"));

        imagenProducto.setDeletedAt(LocalDateTime.now());
        imagenProductoRepository.save(imagenProducto);
    }

    private ImagenProductoResponseDto toResponse(ImagenProducto imagenProducto) {
        return new ImagenProductoResponseDto(
                imagenProducto.getId(),
                imagenProducto.getContentType(),
                imagenProducto.getProducto().getId()
        );
    }
}
