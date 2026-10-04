package com.marketplace.marketplace_backend.modules.perfil;

import com.marketplace.marketplace_backend.config.JwtUtil;
import com.marketplace.marketplace_backend.modules.barrio.Barrio;
import com.marketplace.marketplace_backend.modules.barrio.BarrioRepository;
import com.marketplace.marketplace_backend.modules.direccion.Direccion;
import com.marketplace.marketplace_backend.modules.direccion.DireccionRepository;
import com.marketplace.marketplace_backend.modules.perfil.dto.PerfilActualizadoResponseDto;
import com.marketplace.marketplace_backend.modules.perfil.dto.PerfilContrasenhaRequestDto;
import com.marketplace.marketplace_backend.modules.perfil.dto.PerfilResponseDto;
import com.marketplace.marketplace_backend.modules.perfil.dto.PerfilUpdateRequestDto;
import com.marketplace.marketplace_backend.modules.refreshtoken.RefreshToken;
import com.marketplace.marketplace_backend.modules.refreshtoken.RefreshTokenRepository;
import com.marketplace.marketplace_backend.modules.refreshtoken.RefreshTokenService;
import com.marketplace.marketplace_backend.modules.tienda.TiendaRepository;
import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@AllArgsConstructor
@Service
// Implementación de la lógica del perfil propio: el usuario se toma siempre del
// token (SecurityContext), nunca de un id recibido, para que solo pueda ver y
// editar sus propios datos.
public class PerfilServiceImpl implements PerfilService {

    private static final int DIAS_ENTRE_CAMBIOS_DE_USUARIO = 30;
    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final UsuarioRepository usuarioRepository;
    private final DireccionRepository direccionRepository;
    private final BarrioRepository barrioRepository;
    private final TiendaRepository tiendaRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenService refreshTokenService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public PerfilResponseDto obtenerPerfil() {
        return toResponse(usuarioAutenticado());
    }

    @Override
    @Transactional
    public PerfilActualizadoResponseDto actualizarPerfil(PerfilUpdateRequestDto request) {
        Usuario usuario = usuarioAutenticado();
        String email = request.getEmail().trim();
        String nombreUsuario = request.getUsuario().trim();
        boolean cambioUsuario = !usuario.getUsuario().equals(nombreUsuario);

        if (cambioUsuario) {
            LocalDateTime proximoCambio = proximoCambioUsuario(usuario);
            if (proximoCambio != null) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Solo podés cambiar tu nombre de usuario una vez cada " + DIAS_ENTRE_CAMBIOS_DE_USUARIO
                                + " días. Podrás volver a cambiarlo a partir del " + proximoCambio.format(FORMATO_FECHA));
            }

            if (usuarioRepository.existsByUsuarioIgnoreCaseAndIdNot(nombreUsuario, usuario.getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con ese nombre de usuario");
            }
        }

        if (usuarioRepository.existsByEmailIgnoreCaseAndIdNot(email, usuario.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con ese email");
        }

        boolean hayEdificio = request.getNombreEdificio() != null && !request.getNombreEdificio().isBlank();

        if (!hayEdificio && request.getNroCasa() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El número de casa es obligatorio si no se indica un edificio");
        }

        if (hayEdificio && (request.getNroDepartamento() == null || request.getNroDepartamento().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El número de departamento es obligatorio si se indica un edificio");
        }

        Direccion direccionActual = usuario.getDireccion();
        Barrio barrio = request.getIdBarrio() == null
                ? direccionActual.getBarrio()
                : barrioRepository.findById(request.getIdBarrio())
                        .orElseThrow(() -> new EntityNotFoundException("Barrio no encontrado"));

        // La direccion se edita en el lugar solo si es exclusiva de este usuario;
        // si la comparte con otro usuario o una tienda, se crea una nueva para no
        // modificar datos ajenos.
        boolean direccionExclusiva = usuarioRepository.countByDireccion_Id(direccionActual.getId()) == 1
                && !tiendaRepository.existsByDireccion_Id(direccionActual.getId());
        Direccion direccion = direccionExclusiva ? direccionActual : new Direccion();
        direccion.setCalle(request.getCalle().trim());
        direccion.setNombreEdificio(hayEdificio ? request.getNombreEdificio().trim() : null);
        direccion.setNroCasa(hayEdificio ? null : request.getNroCasa());
        direccion.setNroDepartamento(hayEdificio ? request.getNroDepartamento().trim() : null);
        direccion.setBarrio(barrio);
        usuario.setDireccion(direccionRepository.save(direccion));

        usuario.setNombre(request.getNombre().trim());
        usuario.setApellido(request.getApellido().trim());
        usuario.setEmail(email);

        if (!cambioUsuario) {
            Usuario guardado = usuarioRepository.save(usuario);
            return new PerfilActualizadoResponseDto(toResponse(guardado), null, null);
        }

        usuario.setUsuario(nombreUsuario);
        usuario.setFechaCambioUsuario(LocalDateTime.now());
        Usuario guardado = usuarioRepository.saveAndFlush(usuario);

        // Los tokens llevan el nombre de usuario como subject: se invalidan los
        // refresh tokens anteriores (evita que alguien que tome el nombre viejo
        // pueda usarlos) y se emiten tokens nuevos con el nombre actualizado.
        refreshTokenRepository.deleteByUsuario_Id(guardado.getId());

        String accessToken = jwtUtil.generateToken(guardado.getUsuario(), guardado.getId(), guardado.getRol().getNombre());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(guardado.getUsuario());

        return new PerfilActualizadoResponseDto(toResponse(guardado), accessToken, refreshToken.getToken());
    }

    @Override
    @Transactional
    public void cambiarContrasenha(PerfilContrasenhaRequestDto request) {
        Usuario usuario = usuarioAutenticado();

        if (!passwordEncoder.matches(request.getContrasenhaActual(), usuario.getContrasenha())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña actual no es correcta");
        }

        usuario.setContrasenha(passwordEncoder.encode(request.getContrasenhaNueva()));
        usuarioRepository.save(usuario);

        // Revoca todas las sesiones: el access token actual sigue valiendo hasta
        // vencer, pero no se puede renovar y el usuario deberá iniciar sesión de nuevo.
        refreshTokenRepository.deleteByUsuario_Id(usuario.getId());
    }

    private Usuario usuarioAutenticado() {
        String nombreUsuario = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByUsuarioIgnoreCase(nombreUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado: " + nombreUsuario));
    }

    // Devuelve desde cuándo puede volver a cambiar el nombre de usuario, o null si ya puede.
    private LocalDateTime proximoCambioUsuario(Usuario usuario) {
        if (usuario.getFechaCambioUsuario() == null) {
            return null;
        }
        LocalDateTime proximo = usuario.getFechaCambioUsuario().plusDays(DIAS_ENTRE_CAMBIOS_DE_USUARIO);
        return proximo.isAfter(LocalDateTime.now()) ? proximo : null;
    }

    private PerfilResponseDto toResponse(Usuario usuario) {
        Direccion direccion = usuario.getDireccion();
        Barrio barrio = direccion.getBarrio();
        var ciudad = barrio.getCiudad();
        var departamento = ciudad.getDepartamento();
        var pais = departamento.getPais();

        return new PerfilResponseDto(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getEmail(),
                usuario.getUsuario(),
                proximoCambioUsuario(usuario),
                direccion.getCalle(),
                direccion.getNombreEdificio(),
                direccion.getNroCasa(),
                direccion.getNroDepartamento(),
                barrio.getId(),
                barrio.getNombre(),
                ciudad.getId(),
                ciudad.getNombre(),
                departamento.getId(),
                departamento.getNombre(),
                pais.getId(),
                pais.getNombre()
        );
    }
}
