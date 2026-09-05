package com.marketplace.marketplace_backend.modules.usuario;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Acceso a datos de Usuario: CRUD, búsquedas por email/usuario y validación de duplicados
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Page<Usuario> findAllByOrderByIdAsc(Pageable pageable);

    Page<Usuario> findByNombreContainingIgnoreCaseAndActivo(
            String nombre,
            Boolean activo,
            Pageable pageable
    );

    Page<Usuario> findByNombreContainingIgnoreCase(String nombre, Pageable pageable);

    Page<Usuario> findByActivo(Boolean activo, Pageable pageable);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsuarioIgnoreCase(String usuario);

    Optional<Usuario> findByEmailIgnoreCase(String email);
}
