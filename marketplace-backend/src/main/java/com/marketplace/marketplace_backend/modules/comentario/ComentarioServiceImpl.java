package com.marketplace.marketplace_backend.modules.comentario;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.comentario.dto.ComentarioRequestDto;
import com.marketplace.marketplace_backend.modules.comentario.dto.ComentarioResponseDto;
import com.marketplace.marketplace_backend.modules.publicacion.Publicacion;
import com.marketplace.marketplace_backend.modules.publicacion.PublicacionRepository;
import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@Service
// Implementacion de la gestion de comentarios
public class ComentarioServiceImpl implements ComentarioService {

    private final ComentarioRepository comentarioRepository;
    private final PublicacionRepository publicacionRepository;
    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional
    public ComentarioResponseDto crear(Long idPublicacion, ComentarioRequestDto request) {
        Publicacion publicacion = publicacionRepository.findById(idPublicacion)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Publicación no encontrada"));

        Comentario comentario = new Comentario();
        comentario.setContenido(request.getContenido().trim());
        comentario.setPublicacion(publicacion);
        comentario.setUsuario(usuarioAutenticado());

        return toResponse(comentarioRepository.save(comentario));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResult<List<ComentarioResponseDto>> listarPorPublicacion(Long idPublicacion, int page, int perPage) {
        if (!publicacionRepository.existsById(idPublicacion)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Publicación no encontrada");
        }

        PageRequest pageable = PageRequest.of(Math.max(page, 1) - 1, Math.max(perPage, 1));
        Page<Comentario> resultado = comentarioRepository.findByPublicacion_IdOrderByIdDesc(idPublicacion, pageable);

        List<ComentarioResponseDto> data = resultado.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) resultado.getTotalElements());
    }

    @Override
    @Transactional
    public void eliminarPropio(Long id) {
        Comentario comentario = comentarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comentario no encontrado"));

        if (!comentario.getUsuario().getId().equals(usuarioAutenticado().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No podés borrar un comentario que no es tuyo");
        }

        comentario.setDeletedAt(LocalDateTime.now());
        comentarioRepository.save(comentario);
    }

    @Override
    @Transactional
    public void eliminarDeTienda(Long idTienda, Long id) {
        Comentario comentario = comentarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comentario no encontrado"));

        if (!comentario.getPublicacion().getTienda().getId().equals(idTienda)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comentario no encontrado");
        }

        comentario.setDeletedAt(LocalDateTime.now());
        comentarioRepository.save(comentario);
    }

    private Usuario usuarioAutenticado() {
        String nombreUsuario = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByUsuarioIgnoreCase(nombreUsuario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
    }

    private ComentarioResponseDto toResponse(Comentario comentario) {
        Usuario usuario = comentario.getUsuario();

        return new ComentarioResponseDto(
                comentario.getId(),
                comentario.getContenido(),
                comentario.getPublicacion().getId(),
                usuario.getId(),
                usuario.getNombre() + " " + usuario.getApellido(),
                comentario.getCreatedAt()
        );
    }
}
