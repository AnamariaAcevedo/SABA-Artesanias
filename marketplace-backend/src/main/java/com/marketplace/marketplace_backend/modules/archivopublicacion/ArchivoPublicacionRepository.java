package com.marketplace.marketplace_backend.modules.archivopublicacion;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

// Acceso a datos de ArchivoPublicacion: asignacion y consulta por publicacion
public interface ArchivoPublicacionRepository extends JpaRepository<ArchivoPublicacion, Long> {

    List<ArchivoPublicacion> findByPublicacion_IdOrderByIdAsc(Long idPublicacion);

    // Solo los ids: el canal lista muchas publicaciones y no debe cargar el binario de cada foto.
    @Query("select a.id from ArchivoPublicacion a where a.publicacion.id = :idPublicacion order by a.id")
    List<Long> buscarIdsDePublicacion(@Param("idPublicacion") Long idPublicacion);

    long countByPublicacion_Id(Long idPublicacion);
}
