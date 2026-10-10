package com.marketplace.marketplace_backend.modules.pedido;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.pedido.dto.PedidoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.pedido.dto.PedidoResponseDto;

import java.util.List;

// Operaciones de negocio sobre pedidos: creacion (cliente o invitado), consulta y
// cancelacion propias, gestion desde la tienda, y listado para administracion.
public interface PedidoService {
    PedidoResponseDto crear(PedidoCreateRequestDto request);

    PagedResult<List<PedidoResponseDto>> listarMios(int page, int perPage);

    PedidoResponseDto obtenerMio(Long id);

    PedidoResponseDto cancelarMio(Long id);

    PagedResult<List<PedidoResponseDto>> listarDeTienda(Long idTienda, int page, int perPage);

    PedidoResponseDto obtenerDeTienda(Long idTienda, Long id);

    PedidoResponseDto confirmar(Long idTienda, Long id);

    PedidoResponseDto enviar(Long idTienda, Long id);

    PedidoResponseDto entregar(Long idTienda, Long id);

    PedidoResponseDto cancelarDeTienda(Long idTienda, Long id);

    PagedResult<List<PedidoResponseDto>> listarTodos(int page, int perPage);
}
