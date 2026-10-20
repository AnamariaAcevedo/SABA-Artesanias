package com.marketplace.marketplace_backend.modules.cupon;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.cupon.dto.CuponRequestDto;
import com.marketplace.marketplace_backend.modules.cupon.dto.CuponResponseDto;

import java.util.List;

// Gestion de cupones de descuento de una tienda. La aplicacion del cupon al pagar
// vive en PedidoService (necesita crear el Pedido en la misma transaccion).
public interface CuponService {
    CuponResponseDto crear(Long idTienda, CuponRequestDto request);

    PagedResult<List<CuponResponseDto>> listarDeTienda(Long idTienda, int page, int perPage);

    CuponResponseDto obtenerDeTienda(Long idTienda, Long id);

    void eliminarDeTienda(Long idTienda, Long id);
}
