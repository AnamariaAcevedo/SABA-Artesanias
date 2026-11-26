package com.marketplace.marketplace_backend.modules.barrio;

import java.util.ArrayList;
import com.marketplace.marketplace_backend.modules.solicitudvendedor.SolicitudVendedorRepository;
import com.marketplace.marketplace_backend.modules.pedido.PedidoRepository;
import com.marketplace.marketplace_backend.modules.direccion.DireccionRepository;
import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.barrio.dto.BarrioCreateRequestDto;
import com.marketplace.marketplace_backend.modules.barrio.dto.BarrioFilterDto;
import com.marketplace.marketplace_backend.modules.barrio.dto.BarrioResponseDto;
import com.marketplace.marketplace_backend.modules.barrio.dto.BarrioUpdateRequestDto;
import com.marketplace.marketplace_backend.modules.ciudad.Ciudad;
import com.marketplace.marketplace_backend.modules.ciudad.CiudadRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@Service
// Implementación de la lógica de negocio para gestionar barrios
public class BarrioServiceImpl implements BarrioService {

    private final BarrioRepository barrioRepository;
    private final CiudadRepository ciudadRepository;
    private final DireccionRepository direccionRepository;
    private final PedidoRepository pedidoRepository;
    private final SolicitudVendedorRepository solicitudVendedorRepository;

    @Override
    @Transactional
    public BarrioResponseDto create(BarrioCreateRequestDto request) {
        Ciudad ciudad = ciudadRepository.findById(request.getIdCiudad())
                .orElseThrow(() -> new EntityNotFoundException("Ciudad no encontrada"));

        barrioRepository.findByNombreIgnoreCaseAndCiudad_IdAndDeletedAtIsNull(request.getNombre(), ciudad.getId())
                .ifPresent(b -> {
                    throw new IllegalStateException("Ya existe un barrio activo con ese nombre en esa ciudad");
                });

        Barrio barrio = new Barrio();
        barrio.setNombre(request.getNombre());
        barrio.setCiudad(ciudad);
        Barrio saved = barrioRepository.save(barrio);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public BarrioResponseDto update(Long id, BarrioUpdateRequestDto request) {
        Barrio barrio = barrioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Barrio no encontrado"));

        if (request.getNombre() != null) {
            barrio.setNombre(request.getNombre());
        }

        if (request.getIdCiudad() != null) {
            Ciudad ciudad = ciudadRepository.findById(request.getIdCiudad())
                    .orElseThrow(() -> new EntityNotFoundException("Ciudad no encontrada"));
            barrio.setCiudad(ciudad);
        }

        Barrio updated = barrioRepository.save(barrio);
        return toResponse(updated);
    }

    @Override
    public BarrioResponseDto get(Long id) {
        Barrio barrio = barrioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Barrio no encontrado"));
        return toResponse(barrio);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Barrio barrio = barrioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Barrio no encontrado"));

        // Las direcciones, los pedidos (tambien los historicos, que muestran el barrio de
        // entrega) y las solicitudes de vendedor que lo usan dejarian de cargarse.
        List<String> usos = new ArrayList<>();
        agregarUso(usos, direccionRepository.countByBarrio_Id(id), "dirección", "direcciones");
        agregarUso(usos, pedidoRepository.countByBarrio_Id(id), "pedido", "pedidos");
        agregarUso(usos, solicitudVendedorRepository.countByBarrio_Id(id), "solicitud de vendedor", "solicitudes de vendedor");
        if (!usos.isEmpty()) {
            throw new IllegalStateException("No se puede eliminar el barrio: lo usan " + String.join(", ", usos) + ".");
        }

        barrio.setDeletedAt(LocalDateTime.now());
        barrioRepository.save(barrio);
    }

    @Override
    public PagedResult<List<BarrioResponseDto>> findAll(BarrioFilterDto filter) {
        int page = filter.getPage();
        int perPage = filter.getPerPage();

        Pageable pageable = PageRequest.of(page - 1, perPage);

        String nombre = filter.getNombre();
        if (nombre != null) {
            nombre = nombre.trim();
            if (nombre.isEmpty()) nombre = null;
        }

        Long idCiudad = filter.getIdCiudad();

        boolean hasNombre = nombre != null;
        boolean hasIdCiudad = idCiudad != null;

        Page<Barrio> result;

        if (!hasNombre && !hasIdCiudad) {
            result = barrioRepository.findAllByOrderByIdAsc(pageable);
        } else if (hasNombre && hasIdCiudad) {
            result = barrioRepository.findByNombreContainingIgnoreCaseAndCiudad_Id(nombre, idCiudad, pageable);
        } else if (hasNombre) {
            result = barrioRepository.findByNombreContainingIgnoreCase(nombre, pageable);
        } else {
            result = barrioRepository.findByCiudad_Id(idCiudad, pageable);
        }

        List<BarrioResponseDto> data = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) result.getTotalElements());
    }

    private BarrioResponseDto toResponse(Barrio barrio) {
        return new BarrioResponseDto(
                barrio.getId(),
                barrio.getNombre(),
                barrio.getCiudad().getId(),
                barrio.getCiudad().getNombre(),
                barrio.getCreatedAt(),
                barrio.getUpdatedAt()
        );
    }

    private static void agregarUso(List<String> usos, long cantidad, String singular, String plural) {
        if (cantidad > 0) {
            usos.add(cantidad + " " + (cantidad == 1 ? singular : plural));
        }
    }
}
