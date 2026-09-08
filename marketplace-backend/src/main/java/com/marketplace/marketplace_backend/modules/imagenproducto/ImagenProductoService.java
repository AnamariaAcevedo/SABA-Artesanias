package com.marketplace.marketplace_backend.modules.imagenproducto;

import com.marketplace.marketplace_backend.modules.imagenproducto.dto.ImagenProductoResponseDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

// Operaciones de negocio para subir, listar, obtener y borrar imagenes de un producto
public interface ImagenProductoService {
    ImagenProductoResponseDto create(Long idProducto, MultipartFile archivo);

    List<ImagenProductoResponseDto> listByProducto(Long idProducto);

    ImagenProducto get(Long id);

    void delete(Long id);
}
