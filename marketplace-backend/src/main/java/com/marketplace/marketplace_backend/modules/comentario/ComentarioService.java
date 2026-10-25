package com.marketplace.marketplace_backend.modules.comentario;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.comentario.dto.ComentarioRequestDto;
import com.marketplace.marketplace_backend.modules.comentario.dto.ComentarioResponseDto;

import java.util.List;

// Gestion de comentarios de una publicacion. Un comentario lo borra su propio autor
// (eliminarPropio) o el dueño/colaborador de la tienda que publico (eliminarDeTienda, moderacion).
public interface ComentarioService {
    ComentarioResponseDto crear(Long idPublicacion, ComentarioRequestDto request);

    PagedResult<List<ComentarioResponseDto>> listarPorPublicacion(Long idPublicacion, int page, int perPage);

    void eliminarPropio(Long id);

    void eliminarDeTienda(Long idTienda, Long id);
}
