package com.marketplace.marketplace_backend.modules.tiendausuario;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Acceso a datos de TiendaUsuario: busqueda del vinculo de un usuario con su tienda
public interface TiendaUsuarioRepository extends JpaRepository<TiendaUsuario, Long> {

    Optional<TiendaUsuario> findFirstByUsuario_Id(Long idUsuario);

    boolean existsByUsuario_Id(Long idUsuario);
}
