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

@AllArgsConstructor
@Service
// Implementacion de la gestion de reacciones
public class ReaccionServiceImpl implements ReaccionService {

    private final ReaccionRepository reaccionRepository;
    private final PublicacionRepository publicacionRepository;
    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional
    public long crear(Long idPublicacion) {
        Publicacion publicacion = publicacionRepository.findById(idPublicacion)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Publicación no encontrada"));

        String nombreUsuario = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepository.findByUsuarioIgnoreCase(nombreUsuario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));

        Reaccion reaccion = new Reaccion();
        reaccion.setPublicacion(publicacion);
        reaccion.setUsuario(usuario);
        reaccionRepository.save(reaccion);

        return reaccionRepository.countByPublicacion_Id(idPublicacion);
    }
}
