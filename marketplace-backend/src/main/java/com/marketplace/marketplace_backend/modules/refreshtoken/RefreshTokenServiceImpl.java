package com.marketplace.marketplace_backend.modules.refreshtoken;

import com.marketplace.marketplace_backend.config.JwtUtil;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Date;
import java.util.Optional;

@AllArgsConstructor
@Service
// Implementación de la lógica de negocio para crear, validar e invalidar refresh tokens
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;

    @Override
    @Transactional
    public RefreshToken createRefreshToken(String usuario) {
        String token = jwtUtil.generateRefreshToken(usuario);
        Date expiryDate = jwtUtil.extractTimeExpired(token);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUsuario(usuarioRepository.findByUsuarioIgnoreCase(usuario)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado: " + usuario)));
        refreshToken.setToken(token);
        refreshToken.setExpiryDate(expiryDate);

        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Override
    @Transactional
    public void deleteToken(String token) {
        refreshTokenRepository.deleteByToken(token);
    }

    @Override
    @Transactional
    public boolean validateRefreshToken(String refreshToken) {
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByToken(refreshToken);
        if (tokenOpt.isEmpty()) {
            return false;
        }

        RefreshToken token = tokenOpt.get();

        if (token.getExpiryDate().before(Date.from(Instant.now()))) {
            refreshTokenRepository.delete(token);
            return false;
        }

        return true;
    }
}
