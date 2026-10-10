package com.marketplace.marketplace_backend.modules.cupon;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.cupon.dto.CuponRequestDto;
import com.marketplace.marketplace_backend.modules.cupon.dto.CuponResponseDto;
import com.marketplace.marketplace_backend.modules.tienda.Tienda;
import com.marketplace.marketplace_backend.modules.tienda.TiendaRepository;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@Service
// Implementacion de la gestion de cupones. El codigo se guarda en mayusculas para que la
// busqueda al aplicarlo (ver PedidoServiceImpl) no dependa de como lo haya tipeado el comprador.
public class CuponServiceImpl implements CuponService {

    private final CuponRepository cuponRepository;
    private final TiendaRepository tiendaRepository;

    @Override
    @Transactional
    public CuponResponseDto crear(Long idTienda, CuponRequestDto request) {
        String codigo = request.getCodigo().trim().toUpperCase();

        if (cuponRepository.existsByCodigoIgnoreCase(codigo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un cupón con ese código");
        }
        if (request.getFechaFin().isBefore(request.getFechaInicio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de fin no puede ser anterior a la fecha de inicio");
        }

        Tienda tienda = tiendaRepository.findById(idTienda)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tienda no encontrada"));

        Cupon cupon = new Cupon();
        cupon.setNombre(request.getNombre().trim());
        cupon.setCodigo(codigo);
        cupon.setPorcentaje(request.getPorcentaje());
        cupon.setFechaInicio(request.getFechaInicio());
        cupon.setFechaFin(request.getFechaFin());
        cupon.setTienda(tienda);

        return toResponse(cuponRepository.save(cupon));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResult<List<CuponResponseDto>> listarDeTienda(Long idTienda, int page, int perPage) {
        PageRequest pageable = PageRequest.of(Math.max(page, 1) - 1, Math.max(perPage, 1));
        Page<Cupon> resultado = cuponRepository.findByTienda_IdOrderByIdDesc(idTienda, pageable);

        List<CuponResponseDto> data = resultado.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) resultado.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public CuponResponseDto obtenerDeTienda(Long idTienda, Long id) {
        return toResponse(buscar(idTienda, id));
    }

    @Override
    @Transactional
    public void eliminarDeTienda(Long idTienda, Long id) {
        Cupon cupon = buscar(idTienda, id);
        cupon.setDeletedAt(LocalDateTime.now());
        cuponRepository.save(cupon);
    }

    private Cupon buscar(Long idTienda, Long id) {
        return cuponRepository.findByIdAndTienda_Id(id, idTienda)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cupón no encontrado"));
    }

    private CuponResponseDto toResponse(Cupon cupon) {
        return new CuponResponseDto(
                cupon.getId(),
                cupon.getNombre(),
                cupon.getCodigo(),
                cupon.getPorcentaje(),
                cupon.getFechaInicio(),
                cupon.getFechaFin(),
                cupon.getTienda().getId(),
                cupon.getTienda().getNombre(),
                cupon.getPedido() != null,
                cupon.getPedido() == null ? null : cupon.getPedido().getId()
        );
    }
}
