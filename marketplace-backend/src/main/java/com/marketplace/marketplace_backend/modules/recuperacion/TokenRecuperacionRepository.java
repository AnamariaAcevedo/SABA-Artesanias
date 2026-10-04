package com.marketplace.marketplace_backend.modules.recuperacion;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.Optional;

// Acceso a datos de TokenRecuperacion: búsqueda por hash y limpieza de tokens previos del usuario
public interface TokenRecuperacionRepository extends JpaRepository<TokenRecuperacion, Long> {

    Optional<TokenRecuperacion> findByTokenHash(String tokenHash);

    @Modifying
    void deleteByUsuario_Id(Long idUsuario);
}
