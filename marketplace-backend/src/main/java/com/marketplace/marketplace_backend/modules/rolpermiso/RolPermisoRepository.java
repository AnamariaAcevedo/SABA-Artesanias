package com.marketplace.marketplace_backend.modules.rolpermiso;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

// Acceso a datos de RolPermiso: asignación y consulta de permisos por rol
public interface RolPermisoRepository extends JpaRepository<RolPermiso, RolPermisoId> {

    boolean existsByRol_IdAndPermiso_Id(Long rolId, Long permisoId);

    boolean existsByRol_Id(Long rolId);

    boolean existsByPermiso_Id(Long permisoId);

    void deleteByRol_IdAndPermiso_Id(Long rolId, Long permisoId);

    Page<RolPermiso> findByRol_Id(Long rolId, Pageable pageable);
}
