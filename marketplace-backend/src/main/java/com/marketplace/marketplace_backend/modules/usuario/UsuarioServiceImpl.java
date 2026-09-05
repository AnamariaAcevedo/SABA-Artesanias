package com.marketplace.marketplace_backend.modules.usuario;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.rol.Rol;
import com.marketplace.marketplace_backend.modules.rol.RolRepository;
import com.marketplace.marketplace_backend.modules.usuario.dto.UsuarioCreateRequestDto;
import com.marketplace.marketplace_backend.modules.usuario.dto.UsuarioFilterDto;
import com.marketplace.marketplace_backend.modules.usuario.dto.UsuarioResponseDto;
import com.marketplace.marketplace_backend.modules.usuario.dto.UsuarioUpdateRequestDto;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@Service
// Implementación de la lógica de negocio para gestionar usuarios
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UsuarioResponseDto create(UsuarioCreateRequestDto request) {
        if (usuarioRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new IllegalStateException("Ya existe un usuario con ese email");
        }

        if (usuarioRepository.existsByUsuarioIgnoreCase(request.getUsuario())) {
            throw new IllegalStateException("Ya existe un usuario con ese nombre de usuario");
        }

        Rol rol = rolRepository.findById(request.getIdRol())
                .orElseThrow(() -> new EntityNotFoundException("Rol no encontrado con ID: " + request.getIdRol()));

        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setApellido(request.getApellido());
        usuario.setContrasenha(passwordEncoder.encode(request.getContrasenha()));
        usuario.setEmail(request.getEmail());
        usuario.setUsuario(request.getUsuario());
        usuario.setRol(rol);
        usuario.setContacto(request.getContacto());
        usuario.setActivo(true);

        Usuario saved = usuarioRepository.save(usuario);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public UsuarioResponseDto update(Long id, UsuarioUpdateRequestDto request) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado con ID: " + id));

        if (request.getNombre() != null) {
            usuario.setNombre(request.getNombre());
        }

        if (request.getApellido() != null) {
            usuario.setApellido(request.getApellido());
        }

        if (request.getEmail() != null) {
            usuario.setEmail(request.getEmail());
        }

        if (request.getUsuario() != null) {
            usuario.setUsuario(request.getUsuario());
        }

        if (request.getContacto() != null) {
            usuario.setContacto(request.getContacto());
        }

        if (request.getActivo() != null) {
            usuario.setActivo(request.getActivo());
        }

        if (request.getIdRol() != null) {
            Rol rol = rolRepository.findById(request.getIdRol())
                    .orElseThrow(() -> new EntityNotFoundException("Rol no encontrado con ID: " + request.getIdRol()));
            usuario.setRol(rol);
        }

        Usuario updated = usuarioRepository.save(usuario);
        return toResponse(updated);
    }

    @Override
    public UsuarioResponseDto get(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado con ID: " + id));
        return toResponse(usuario);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado con ID: " + id));

        usuario.setDeletedAt(LocalDateTime.now());
        usuarioRepository.save(usuario);
    }

    @Override
    public PagedResult<List<UsuarioResponseDto>> findAll(UsuarioFilterDto filter) {
        int page = filter.getPage();
        int perPage = filter.getPerPage();

        Pageable pageable = PageRequest.of(page - 1, perPage);

        String nombre = filter.getNombre();
        if (nombre != null) {
            nombre = nombre.trim();
            if (nombre.isEmpty()) nombre = null;
        }

        Boolean activo = filter.getActivo();

        boolean hasNombre = nombre != null;
        boolean hasActivo = activo != null;

        Page<Usuario> result;

        if (!hasNombre && !hasActivo) {
            result = usuarioRepository.findAllByOrderByIdAsc(pageable);
        } else if (hasNombre && hasActivo) {
            result = usuarioRepository.findByNombreContainingIgnoreCaseAndActivo(nombre, activo, pageable);
        } else if (hasNombre) {
            result = usuarioRepository.findByNombreContainingIgnoreCase(nombre, pageable);
        } else {
            result = usuarioRepository.findByActivo(activo, pageable);
        }

        List<UsuarioResponseDto> data = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) result.getTotalElements());
    }

    @Override
    public List<UsuarioResponseDto> findAllOptions() {
        return usuarioRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    private UsuarioResponseDto toResponse(Usuario usuario) {
        return new UsuarioResponseDto(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getEmail(),
                usuario.getUsuario(),
                usuario.getRol().getId(),
                usuario.getRol().getNombre(),
                usuario.getContacto(),
                usuario.getActivo(),
                usuario.getCreatedAt(),
                usuario.getUpdatedAt()
        );
    }
}
