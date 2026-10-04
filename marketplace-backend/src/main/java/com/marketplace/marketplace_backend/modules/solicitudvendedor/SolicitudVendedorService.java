package com.marketplace.marketplace_backend.modules.solicitudvendedor;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.solicitudvendedor.dto.SolicitudVendedorRequestDto;
import com.marketplace.marketplace_backend.modules.solicitudvendedor.dto.SolicitudVendedorResponseDto;

import java.util.List;

// Operaciones de negocio para solicitar ser vendedor y revisar esas solicitudes
public interface SolicitudVendedorService {
    SolicitudVendedorResponseDto crear(SolicitudVendedorRequestDto request);

    SolicitudVendedorResponseDto obtenerMia();

    void eliminarMia();

    PagedResult<List<SolicitudVendedorResponseDto>> listar(String estado, int page, int perPage);

    SolicitudVendedorResponseDto aceptar(Long id);

    SolicitudVendedorResponseDto rechazar(Long id, String motivo);
}
