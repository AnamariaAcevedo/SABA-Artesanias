package com.marketplace.marketplace_backend.modules.publicacion;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.archivopublicacion.ArchivoPublicacion;
import com.marketplace.marketplace_backend.modules.archivopublicacion.ArchivoPublicacionRepository;
import com.marketplace.marketplace_backend.modules.cupon.Cupon;
import com.marketplace.marketplace_backend.modules.cupon.CuponRepository;
import com.marketplace.marketplace_backend.modules.publicacion.dto.PublicacionRequestDto;
import com.marketplace.marketplace_backend.modules.publicacion.dto.PublicacionResponseDto;
import com.marketplace.marketplace_backend.modules.reaccion.ReaccionRepository;
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
// Implementacion de la gestion de publicaciones
public class PublicacionServiceImpl implements PublicacionService {

    private final PublicacionRepository publicacionRepository;
    private final TiendaRepository tiendaRepository;
    private final CuponRepository cuponRepository;
    private final ReaccionRepository reaccionRepository;
    private final ArchivoPublicacionRepository archivoPublicacionRepository;

    @Override
    @Transactional
    public PublicacionResponseDto crear(Long idTienda, PublicacionRequestDto request) {
        Tienda tienda = tiendaRepository.findById(idTienda)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tienda no encontrada"));

        Publicacion publicacion = new Publicacion();
        publicacion.setTitulo(request.getTitulo().trim());
        publicacion.setContenido(request.getContenido().trim());
        publicacion.setTienda(tienda);
        publicacion.setCupon(resolverCupon(idTienda, request.getIdCupon()));

        return toResponse(publicacionRepository.save(publicacion));
    }

    @Override
    @Transactional
    public PublicacionResponseDto actualizar(Long idTienda, Long id, PublicacionRequestDto request) {
        Publicacion publicacion = buscar(idTienda, id);

        publicacion.setTitulo(request.getTitulo().trim());
        publicacion.setContenido(request.getContenido().trim());
        publicacion.setCupon(resolverCupon(idTienda, request.getIdCupon()));

        return toResponse(publicacionRepository.save(publicacion));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResult<List<PublicacionResponseDto>> listarDeTienda(Long idTienda, int page, int perPage) {
        PageRequest pageable = PageRequest.of(Math.max(page, 1) - 1, Math.max(perPage, 1));
        Page<Publicacion> resultado = publicacionRepository.findByTienda_IdOrderByIdDesc(idTienda, pageable);
        return toPagedResult(resultado, page, perPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PublicacionResponseDto obtenerDeTienda(Long idTienda, Long id) {
        return toResponse(buscar(idTienda, id));
    }

    @Override
    @Transactional
    public void eliminarDeTienda(Long idTienda, Long id) {
        Publicacion publicacion = buscar(idTienda, id);

        // Los archivos adjuntos tambien se dan de baja, para no dejarlos huerfanos.
        LocalDateTime ahora = LocalDateTime.now();
        List<ArchivoPublicacion> archivos = archivoPublicacionRepository.findByPublicacion_IdOrderByIdAsc(id);
        archivos.forEach(archivo -> archivo.setDeletedAt(ahora));
        archivoPublicacionRepository.saveAll(archivos);

        publicacion.setDeletedAt(ahora);
        publicacionRepository.save(publicacion);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResult<List<PublicacionResponseDto>> findAllPublicas(Long idTienda, int page, int perPage) {
        PageRequest pageable = PageRequest.of(Math.max(page, 1) - 1, Math.max(perPage, 1));
        Page<Publicacion> resultado = idTienda != null
                ? publicacionRepository.findByTienda_IdOrderByIdDesc(idTienda, pageable)
                : publicacionRepository.findAllByOrderByIdDesc(pageable);
        return toPagedResult(resultado, page, perPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PublicacionResponseDto obtenerPublica(Long id) {
        Publicacion publicacion = publicacionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Publicación no encontrada"));
        return toResponse(publicacion);
    }

    private Cupon resolverCupon(Long idTienda, Long idCupon) {
        if (idCupon == null) {
            return null;
        }

        Cupon cupon = cuponRepository.findById(idCupon)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cupón no encontrado"));

        if (!cupon.getTienda().getId().equals(idTienda)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este cupón no pertenece a tu tienda");
        }

        return cupon;
    }

    private Publicacion buscar(Long idTienda, Long id) {
        return publicacionRepository.findByIdAndTienda_Id(id, idTienda)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Publicación no encontrada"));
    }

    private PagedResult<List<PublicacionResponseDto>> toPagedResult(Page<Publicacion> resultado, int page, int perPage) {
        List<PublicacionResponseDto> data = resultado.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) resultado.getTotalElements());
    }

    private PublicacionResponseDto toResponse(Publicacion publicacion) {
        Cupon cupon = publicacion.getCupon();

        return new PublicacionResponseDto(
                publicacion.getId(),
                publicacion.getTitulo(),
                publicacion.getContenido(),
                publicacion.getTienda().getId(),
                publicacion.getTienda().getNombre(),
                cupon == null ? null : cupon.getId(),
                cupon == null ? null : cupon.getCodigo(),
                reaccionRepository.countByPublicacion_Id(publicacion.getId()),
                publicacion.getCreatedAt(),
                publicacion.getUpdatedAt()
        );
    }
}
