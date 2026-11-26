package com.marketplace.marketplace_backend.modules.comentario;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.comentario.dto.ComentarioRequestDto;
import com.marketplace.marketplace_backend.modules.comentario.dto.ComentarioResponseDto;

import java.util.List;

// Gestion de comentarios de una publicacion. Un comentario lo puede borrar su autor
// o la tienda que hizo la publicacion (moderacion, desde /mi-tienda/publicaciones).
public interface ComentarioService {
    ComentarioResponseDto crear(Long idPublicacion, ComentarioRequestDto request);

    PagedResult<List<ComentarioResponseDto>> listarPorPublicacion(Long idPublicacion, int page, int perPage);

    void eliminarPropio(Long id);

    // Quien llama ya verifico que la publicacion es de la tienda que modera.
    void eliminarDePublicacion(Long idPublicacion, Long id);
}
