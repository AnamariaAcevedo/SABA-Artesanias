package com.marketplace.marketplace_backend.modules.publicacion;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

// Acceso a datos de Publicacion
public interface PublicacionRepository extends JpaRepository<Publicacion, Long> {
    Page<Publicacion> findByTienda_IdOrderByIdDesc(Long idTienda, Pageable pageable);

    Optional<Publicacion> findByIdAndTienda_Id(Long id, Long idTienda);

    @Query("""
            select p from Publicacion p
            where p.fechaExpiracion is null or p.fechaExpiracion > :ahora
            order by p.id desc
            """)
    Page<Publicacion> buscarVigentes(@Param("ahora") LocalDateTime ahora, Pageable pageable);

    @Query("""
            select p from Publicacion p
            where p.tienda.id = :idTienda and (p.fechaExpiracion is null or p.fechaExpiracion > :ahora)
            order by p.id desc
            """)
    Page<Publicacion> buscarVigentesDeTienda(@Param("idTienda") Long idTienda, @Param("ahora") LocalDateTime ahora, Pageable pageable);
}
