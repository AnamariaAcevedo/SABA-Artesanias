package com.marketplace.marketplace_backend.modules.refreshtoken;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.Optional;

// Acceso a datos de RefreshToken: búsqueda y borrado por token o por usuario
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    @Modifying
    void deleteByToken(String token);

    @Modifying
    void deleteByUsuario_Id(Long idUsuario);
}
