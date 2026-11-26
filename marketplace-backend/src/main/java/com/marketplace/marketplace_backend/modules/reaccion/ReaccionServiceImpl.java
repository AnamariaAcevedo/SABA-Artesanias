package com.marketplace.marketplace_backend.modules.reaccion;

import com.marketplace.marketplace_backend.modules.publicacion.Publicacion;
import com.marketplace.marketplace_backend.modules.publicacion.PublicacionRepository;
import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@AllArgsConstructor
@Service
// Implementacion de la gestion de reacciones. Una publicacion vencida ya no esta
// disponible para el publico, asi que tampoco acepta cambios.
public class ReaccionServiceImpl implements ReaccionService {

    private final ReaccionRepository reaccionRepository;
    private final PublicacionRepository publicacionRepository;
    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional
    public long crear(Long idPublicacion) {
        Publicacion publicacion = publicacionVigente(idPublicacion);
        Usuario usuario = usuarioAutenticado();

        // Volver a reaccionar no suma: puede pasar con un doble clic o desde otra pestaña.
        if (!reaccionRepository.existsByPublicacion_IdAndUsuario_Id(idPublicacion, usuario.getId())) {
            Reaccion reaccion = new Reaccion();
            reaccion.setPublicacion(publicacion);
            reaccion.setUsuario(usuario);
            reaccionRepository.save(reaccion);
        }

        return reaccionRepository.countByPublicacion_Id(idPublicacion);
    }

    @Override
    @Transactional
    public long quitar(Long idPublicacion) {
        publicacionVigente(idPublicacion);
        reaccionRepository.borrarDeUsuario(idPublicacion, usuarioAutenticado().getId());
        return reaccionRepository.countByPublicacion_Id(idPublicacion);
    }

    private Publicacion publicacionVigente(Long idPublicacion) {
        return publicacionRepository.findById(idPublicacion)
                .filter(publicacion -> publicacion.estaVigente(LocalDateTime.now()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Publicación no encontrada"));
    }

    private Usuario usuarioAutenticado() {
        String nombreUsuario = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByUsuarioIgnoreCase(nombreUsuario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
    }
}
