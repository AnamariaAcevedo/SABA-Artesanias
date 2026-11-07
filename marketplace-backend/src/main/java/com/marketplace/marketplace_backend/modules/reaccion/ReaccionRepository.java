package com.marketplace.marketplace_backend.modules.reaccion;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

// Acceso a datos de Reaccion
public interface ReaccionRepository extends JpaRepository<Reaccion, Long> {
    long countByPublicacion_Id(Long idPublicacion);

    boolean existsByPublicacion_IdAndUsuario_Id(Long idPublicacion, Long idUsuario);

    @Modifying
    @Query("delete from Reaccion r where r.publicacion.id = :idPublicacion and r.usuario.id = :idUsuario")
    void borrarDeUsuario(@Param("idPublicacion") Long idPublicacion, @Param("idUsuario") Long idUsuario);
}
