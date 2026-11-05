package com.marketplace.marketplace_backend.modules.publicacion;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.publicacion.dto.PublicacionRequestDto;
import com.marketplace.marketplace_backend.modules.publicacion.dto.PublicacionResponseDto;

import java.util.List;

// Gestion de publicaciones de una tienda. La creacion/edicion/borrado se hace siempre
// contra la tienda del vendedor autenticado; la lectura es publica para los compradores.
public interface PublicacionService {
    PublicacionResponseDto crear(Long idTienda, PublicacionRequestDto request);

    PublicacionResponseDto actualizar(Long idTienda, Long id, PublicacionRequestDto request);

    PagedResult<List<PublicacionResponseDto>> listarDeTienda(Long idTienda, int page, int perPage);

    PublicacionResponseDto obtenerDeTienda(Long idTienda, Long id);

    void eliminarDeTienda(Long idTienda, Long id);

    // Lectura publica (catalogo de publicaciones que ven los compradores)
    PagedResult<List<PublicacionResponseDto>> findAllPublicas(Long idTienda, int page, int perPage);

    PublicacionResponseDto obtenerPublica(Long id);
}
