package com.marketplace.marketplace_backend.modules.tienda;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.Optional;

// Acceso a datos de Tienda: CRUD y búsqueda por nombre
public interface TiendaRepository extends JpaRepository<Tienda, Long> {
    Page<Tienda> findAllByOrderByIdAsc(Pageable pageable);

    Page<Tienda> findByNombreContainingIgnoreCase(String nombre, Pageable pageable);

    boolean existsByDireccion_Id(Long idDireccion);

    long countByDireccion_Id(Long idDireccion);

    // Bloquea la fila de la tienda hasta el fin de la transaccion: serializa la creacion de
    // pedidos de una misma tienda para que dos compras simultaneas no tomen el mismo numero.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Tienda t WHERE t.id = :id")
    Optional<Tienda> findByIdParaActualizar(@Param("id") Long id);
}
