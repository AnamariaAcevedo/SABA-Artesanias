package com.marketplace.marketplace_backend.modules.auth;

import com.marketplace.marketplace_backend.config.JwtUtil;
import com.marketplace.marketplace_backend.modules.auth.dto.AuthResponseDto;
import com.marketplace.marketplace_backend.modules.refreshtoken.RefreshToken;
import com.marketplace.marketplace_backend.modules.refreshtoken.RefreshTokenService;
import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@AllArgsConstructor
@Service
// Implementación de la lógica de negocio de login y refresh de tokens
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final UsuarioRepository usuarioRepository;

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
}
