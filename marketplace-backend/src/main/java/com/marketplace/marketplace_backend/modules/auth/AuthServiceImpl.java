package com.marketplace.marketplace_backend.modules.auth;

import com.marketplace.marketplace_backend.config.JwtUtil;
import com.marketplace.marketplace_backend.modules.auth.dto.AuthResponseDto;
import com.marketplace.marketplace_backend.modules.auth.dto.RegistroRequestDto;
import com.marketplace.marketplace_backend.modules.direccion.Direccion;
import com.marketplace.marketplace_backend.modules.direccion.DireccionRepository;
import com.marketplace.marketplace_backend.modules.refreshtoken.RefreshToken;
import com.marketplace.marketplace_backend.modules.refreshtoken.RefreshTokenService;
import com.marketplace.marketplace_backend.modules.rol.Rol;
import com.marketplace.marketplace_backend.modules.rol.RolRepository;
import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@AllArgsConstructor
@Service
// Implementación de la lógica de negocio de login, refresh de tokens y registro
public class AuthServiceImpl implements AuthService {

    private static final String ROL_CLIENTE = "Cliente";

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final DireccionRepository direccionRepository;
    private final PasswordEncoder passwordEncoder;

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
        if (usuarioRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new IllegalStateException("Ya existe un usuario con ese email");
        }

        if (usuarioRepository.existsByUsuarioIgnoreCase(request.getUsuario())) {
            throw new IllegalStateException("Ya existe un usuario con ese nombre de usuario");
        }

        Rol rolCliente = rolRepository.findByNombreAndDeletedAtIsNull(ROL_CLIENTE)
                .orElseThrow(() -> new EntityNotFoundException("Rol no encontrado: " + ROL_CLIENTE));

        Direccion direccion = direccionRepository.findById(request.getIdDireccion())
                .orElseThrow(() -> new EntityNotFoundException("Dirección no encontrada"));

        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setApellido(request.getApellido());
        usuario.setContrasenha(passwordEncoder.encode(request.getContrasenha()));
        usuario.setEmail(request.getEmail());
        usuario.setUsuario(request.getUsuario());
        usuario.setRol(rolCliente);
        usuario.setContacto(request.getContacto());
        usuario.setDireccion(direccion);
        usuario.setActivo(true);

        Usuario saved = usuarioRepository.save(usuario);

        String accessToken = jwtUtil.generateToken(saved.getUsuario(), saved.getId(), saved.getRol().getNombre());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(saved.getUsuario());

        return new AuthResponseDto(accessToken, refreshToken.getToken(), saved.getUsuario());
    }
}
