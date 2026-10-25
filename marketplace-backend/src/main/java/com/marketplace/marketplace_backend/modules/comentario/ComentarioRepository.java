package com.marketplace.marketplace_backend.modules.comentario;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Acceso a datos de Comentario
public interface ComentarioRepository extends JpaRepository<Comentario, Long> {
    Page<Comentario> findByPublicacion_IdOrderByIdDesc(Long idPublicacion, Pageable pageable);

    Optional<Comentario> findByIdAndPublicacion_Id(Long id, Long idPublicacion);

    long countByPublicacion_Id(Long idPublicacion);
}
