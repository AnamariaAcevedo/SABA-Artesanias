package com.marketplace.marketplace_backend.modules.usuario;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.barrio.Barrio;
import com.marketplace.marketplace_backend.modules.barrio.BarrioRepository;
import com.marketplace.marketplace_backend.modules.direccion.Direccion;
import com.marketplace.marketplace_backend.modules.direccion.DireccionRepository;
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
    private final DireccionRepository direccionRepository;
    private final BarrioRepository barrioRepository;
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

        Barrio barrio = barrioRepository.findById(request.getIdBarrio())
                .orElseThrow(() -> new EntityNotFoundException("Barrio no encontrado"));

        boolean hayEdificio = request.getNombreEdificio() != null && !request.getNombreEdificio().isBlank();

        if (!hayEdificio && request.getNroCasa() == null) {
            throw new IllegalArgumentException("El número de casa es obligatorio si no se indica un edificio");
        }

        if (hayEdificio && (request.getNroDepartamento() == null || request.getNroDepartamento().isBlank())) {
            throw new IllegalArgumentException("El número de departamento es obligatorio si se indica un edificio");
        }

        Direccion direccion = new Direccion();
        direccion.setCalle(request.getCalle());
        direccion.setNombreEdificio(request.getNombreEdificio());
        direccion.setNroCasa(request.getNroCasa());
        direccion.setNroDepartamento(request.getNroDepartamento());
        direccion.setBarrio(barrio);
        Direccion direccionGuardada = direccionRepository.save(direccion);

        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setApellido(request.getApellido());
        usuario.setContrasenha(passwordEncoder.encode(request.getContrasenha()));
        usuario.setEmail(request.getEmail());
        usuario.setUsuario(request.getUsuario());
        usuario.setTelefono(normalizarTelefono(request.getTelefono()));
        usuario.setRol(rol);
        usuario.setDireccion(direccionGuardada);
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

        if (request.getTelefono() != null) {
            usuario.setTelefono(normalizarTelefono(request.getTelefono()));
        }

        if (request.getActivo() != null) {
            usuario.setActivo(request.getActivo());
        }

        if (request.getIdRol() != null) {
            Rol rol = rolRepository.findById(request.getIdRol())
                    .orElseThrow(() -> new EntityNotFoundException("Rol no encontrado con ID: " + request.getIdRol()));
            usuario.setRol(rol);
        }

        if (request.getIdDireccion() != null) {
            Direccion direccion = direccionRepository.findById(request.getIdDireccion())
                    .orElseThrow(() -> new EntityNotFoundException("Dirección no encontrada"));
            usuario.setDireccion(direccion);
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

    // Convierte 0981123456 en 595981123456 (formato internacional sin +).
    private static String normalizarTelefono(String telefono) {
        return "595" + telefono.trim().substring(1);
    }

    private UsuarioResponseDto toResponse(Usuario usuario) {
        return new UsuarioResponseDto(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getEmail(),
                usuario.getUsuario(),
                usuario.getTelefono(),
                usuario.getRol().getId(),
                usuario.getRol().getNombre(),
                usuario.getDireccion().getId(),
                usuario.getDireccion().getCalle(),
                usuario.getActivo(),
                usuario.getCreatedAt(),
                usuario.getUpdatedAt()
        );
    }
}
