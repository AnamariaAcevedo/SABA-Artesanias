package com.marketplace.marketplace_backend.modules.archivopublicacion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// Acceso a datos de ArchivoPublicacion: asignacion y consulta por publicacion
public interface ArchivoPublicacionRepository extends JpaRepository<ArchivoPublicacion, Long> {

    List<ArchivoPublicacion> findByPublicacion_IdOrderByIdAsc(Long idPublicacion);
}
