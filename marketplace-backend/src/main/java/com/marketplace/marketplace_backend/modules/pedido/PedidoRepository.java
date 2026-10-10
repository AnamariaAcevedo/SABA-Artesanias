package com.marketplace.marketplace_backend.modules.pedido;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Acceso a datos de Pedido
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    Page<Pedido> findByUsuario_IdOrderByIdDesc(Long idUsuario, Pageable pageable);

    Optional<Pedido> findByIdAndUsuario_Id(Long id, Long idUsuario);

    Page<Pedido> findByTienda_IdOrderByIdDesc(Long idTienda, Pageable pageable);

    Optional<Pedido> findByIdAndTienda_Id(Long id, Long idTienda);

    Page<Pedido> findAllByOrderByIdDesc(Pageable pageable);
}
