package com.marketplace.marketplace_backend.modules.reaccion;

import org.springframework.data.jpa.repository.JpaRepository;

// Acceso a datos de Reaccion
public interface ReaccionRepository extends JpaRepository<Reaccion, Long> {
    long countByPublicacion_Id(Long idPublicacion);
}
