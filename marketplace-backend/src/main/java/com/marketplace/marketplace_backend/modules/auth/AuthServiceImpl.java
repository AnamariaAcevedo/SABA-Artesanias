package com.marketplace.marketplace_backend.modules.auth;

import com.marketplace.marketplace_backend.config.JwtUtil;
import com.marketplace.marketplace_backend.modules.auth.dto.AuthResponseDto;
import com.marketplace.marketplace_backend.modules.auth.dto.RegistroRequestDto;
import com.marketplace.marketplace_backend.modules.auth.dto.SesionActualResponseDto;
import com.marketplace.marketplace_backend.modules.barrio.Barrio;
import com.marketplace.marketplace_backend.modules.barrio.BarrioRepository;
import com.marketplace.marketplace_backend.modules.direccion.Direccion;
import com.marketplace.marketplace_backend.modules.direccion.DireccionRepository;
import com.marketplace.marketplace_backend.modules.refreshtoken.RefreshToken;
import com.marketplace.marketplace_backend.modules.refreshtoken.RefreshTokenService;
import com.marketplace.marketplace_backend.modules.rol.Rol;
import com.marketplace.marketplace_backend.modules.rol.RolRepository;
import com.marketplace.marketplace_backend.modules.tiendausuario.TiendaUsuario;
import com.marketplace.marketplace_backend.modules.tiendausuario.TiendaUsuarioRepository;
import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@AllArgsConstructor
@Service
// Implementación de la lógica de negocio de login, refresh de tokens, registro y logout
public class AuthServiceImpl implements AuthService {

    private static final String ROL_CLIENTE = "Cliente";

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final DireccionRepository direccionRepository;
    private final BarrioRepository barrioRepository;
    private final PasswordEncoder passwordEncoder;
    private final TiendaUsuarioRepository tiendaUsuarioRepository;

    @Override
    @Transactional
    public AuthResponseDto authenticateAndGenerateToken(String usuario, String contrasenha) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(usuario, contrasenha)
        );

        Usuario usuarioEntity = usuarioRepository.findByUsuarioIgnoreCase(usuario)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado: " + usuario));

        String accessToken = jwtUtil.generateToken(
                usuarioEntity.getUsuario(),
                usuarioEntity.getId(),
                usuarioEntity.getRol().getNombre()
        );

        RefreshToken refreshToken = refreshTokenService.createRefreshToken(usuario);

        return new AuthResponseDto(accessToken, refreshToken.getToken(), usuario);
    }

    @Override
    @Transactional
    public AuthResponseDto generateRefreshToken(String refreshToken, String accessToken) {
        String usuarioDesdeAccess = jwtUtil.extractUsuario(accessToken);
        String usuarioDesdeRefresh = jwtUtil.extractUsuario(refreshToken);

        if (!refreshTokenService.validateRefreshToken(refreshToken) || !jwtUtil.isSignedByUs(accessToken)) {
            throw new IllegalArgumentException("Refresh token inválido");
        }

        if (!usuarioDesdeAccess.equals(usuarioDesdeRefresh)) {
            throw new IllegalArgumentException("El token no corresponde al usuario");
        }

        refreshTokenService.deleteToken(refreshToken);

        Usuario usuarioEntity = usuarioRepository.findByUsuarioIgnoreCase(usuarioDesdeAccess)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado: " + usuarioDesdeAccess));

        String nuevoAccessToken = jwtUtil.generateToken(
                usuarioEntity.getUsuario(),
                usuarioEntity.getId(),
                usuarioEntity.getRol().getNombre()
        );

        RefreshToken nuevoRefreshToken = refreshTokenService.createRefreshToken(usuarioDesdeRefresh);

        return new AuthResponseDto(nuevoAccessToken, nuevoRefreshToken.getToken(), usuarioDesdeRefresh);
    }

    @Override
    @Transactional
    public AuthResponseDto registrar(RegistroRequestDto request) {
        String email = request.getEmail().trim();
        String nombreUsuario = request.getUsuario().trim();

        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalStateException("Ya existe un usuario con ese email");
        }

        if (usuarioRepository.existsByUsuarioIgnoreCase(nombreUsuario)) {
            throw new IllegalStateException("Ya existe un usuario con ese nombre de usuario");
        }

        Rol rolCliente = rolRepository.findByNombreAndDeletedAtIsNull(ROL_CLIENTE)
                .orElseThrow(() -> new EntityNotFoundException("Rol no encontrado: " + ROL_CLIENTE));

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
        usuario.setEmail(email);
        usuario.setUsuario(nombreUsuario);
        usuario.setTelefono(normalizarTelefono(request.getTelefono()));
        usuario.setRol(rolCliente);
        usuario.setDireccion(direccionGuardada);
        usuario.setActivo(true);

        Usuario saved = usuarioRepository.save(usuario);

        String accessToken = jwtUtil.generateToken(saved.getUsuario(), saved.getId(), saved.getRol().getNombre());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(saved.getUsuario());

        return new AuthResponseDto(accessToken, refreshToken.getToken(), saved.getUsuario());
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        refreshTokenService.deleteToken(refreshToken);
    }

    // Convierte 0981123456 en 595981123456 (formato internacional sin +).
    private static String normalizarTelefono(String telefono) {
        return "595" + telefono.trim().substring(1);
    }

    @Override
    @Transactional(readOnly = true)
    public SesionActualResponseDto obtenerSesionActual() {
        String nombreUsuario = SecurityContextHolder.getContext().getAuthentication().getName();

        Usuario usuarioEntity = usuarioRepository.findByUsuarioIgnoreCase(nombreUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado: " + nombreUsuario));

        List<String> permisos = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> !authority.startsWith("ROLE_"))
                .toList();

        TiendaUsuario vinculo = tiendaUsuarioRepository.findFirstByUsuario_Id(usuarioEntity.getId()).orElse(null);

        return new SesionActualResponseDto(
                usuarioEntity.getId(),
                usuarioEntity.getUsuario(),
                usuarioEntity.getNombre(),
                usuarioEntity.getApellido(),
                usuarioEntity.getEmail(),
                usuarioEntity.getRol().getNombre(),
                permisos,
                vinculo == null ? null : vinculo.getTienda().getId(),
                vinculo == null ? null : vinculo.getTienda().getNombre(),
                vinculo == null ? null : vinculo.getTipo().name()
        );
    }
}
