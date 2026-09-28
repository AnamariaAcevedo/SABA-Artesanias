package com.marketplace.marketplace_backend.modules.contacto;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

// Acceso a datos de Contacto: CRUD y búsqueda por tienda/tipo de contacto
public interface ContactoRepository extends JpaRepository<Contacto, Long> {
    Page<Contacto> findAllByOrderByIdAsc(Pageable pageable);

    Page<Contacto> findByTienda_Id(Long idTienda, Pageable pageable);

    Page<Contacto> findByTipoContacto_Id(Long idTipoContacto, Pageable pageable);

    Page<Contacto> findByTienda_IdAndTipoContacto_Id(Long idTienda, Long idTipoContacto, Pageable pageable);
}
