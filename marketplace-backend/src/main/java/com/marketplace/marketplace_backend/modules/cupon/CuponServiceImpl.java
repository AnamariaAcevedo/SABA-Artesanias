package com.marketplace.marketplace_backend.modules.cupon;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.cupon.dto.CuponPreviewResponseDto;
import com.marketplace.marketplace_backend.modules.cupon.dto.CuponPublicoResponseDto;
import com.marketplace.marketplace_backend.modules.cupon.dto.CuponRequestDto;
import com.marketplace.marketplace_backend.modules.cupon.dto.CuponResponseDto;
import com.marketplace.marketplace_backend.modules.pedido.PedidoRepository;
import com.marketplace.marketplace_backend.modules.tienda.Tienda;
import com.marketplace.marketplace_backend.modules.tienda.TiendaRepository;
import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@Service
// Implementacion de la gestion de cupones. El codigo se guarda en mayusculas para que la
// busqueda al aplicarlo (ver PedidoServiceImpl) no dependa de como lo haya tipeado el comprador.
public class CuponServiceImpl implements CuponService {

    private final CuponRepository cuponRepository;
    private final TiendaRepository tiendaRepository;
    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;

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

    // Vista previa para el carrito: valida el cupon sin crear ningun pedido, para mostrar el
    // descuento antes de confirmar la compra. La validacion definitiva vuelve a pasar en
    // PedidoServiceImpl.resolverCupon al confirmar, por seguridad (esto es solo para la UI).
    @Override
    @Transactional(readOnly = true)
    public CuponPreviewResponseDto validar(Long idTienda, String codigo) {
        if (codigo == null || codigo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingresá un código de cupón");
        }

        Cupon cupon = cuponRepository.findByCodigoIgnoreCase(codigo.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cupón no encontrado"));

        if (!cupon.getTienda().getId().equals(idTienda)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este cupón no es válido para esta tienda");
        }

        LocalDate hoy = LocalDate.now();
        if (hoy.isBefore(cupon.getFechaInicio()) || hoy.isAfter(cupon.getFechaFin())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este cupón no está vigente");
        }

        Usuario usuario = usuarioAutenticadoOpcional();
        if (usuario != null && pedidoRepository.existsByUsuario_IdAndCupon_Id(usuario.getId(), cupon.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ya usaste este cupón");
        }

        return new CuponPreviewResponseDto(cupon.getCodigo(), cupon.getNombre(), cupon.getPorcentaje());
    }

    // Catalogo publico: cupones vigentes de todas las tiendas, para que cualquier visitante
    // los vea y obtenga el codigo sin necesidad de saberlo de antemano.
    @Override
    @Transactional(readOnly = true)
    public PagedResult<List<CuponPublicoResponseDto>> listarVigentes(int page, int perPage) {
        PageRequest pageable = PageRequest.of(Math.max(page, 1) - 1, Math.max(perPage, 1));
        LocalDate hoy = LocalDate.now();
        Page<Cupon> resultado = cuponRepository
                .findByFechaInicioLessThanEqualAndFechaFinGreaterThanEqualOrderByIdDesc(hoy, hoy, pageable);

        List<CuponPublicoResponseDto> data = resultado.getContent().stream()
                .map(this::toPublico)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) resultado.getTotalElements());
    }

    private CuponPublicoResponseDto toPublico(Cupon cupon) {
        return new CuponPublicoResponseDto(
                cupon.getId(),
                cupon.getNombre(),
                cupon.getCodigo(),
                cupon.getPorcentaje(),
                cupon.getTienda().getId(),
                cupon.getTienda().getNombre()
        );
    }

    private Usuario usuarioAutenticadoOpcional() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return usuarioRepository.findByUsuarioIgnoreCase(auth.getName()).orElse(null);
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
                pedidoRepository.countByCupon_Id(cupon.getId())
        );
    }
}
