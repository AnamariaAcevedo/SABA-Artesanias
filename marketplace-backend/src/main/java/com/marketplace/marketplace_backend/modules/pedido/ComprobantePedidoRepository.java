package com.marketplace.marketplace_backend.modules.pedido;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Acceso a datos de ComprobantePedido
public interface ComprobantePedidoRepository extends JpaRepository<ComprobantePedido, Long> {
    boolean existsByPedido_Id(Long idPedido);

    Optional<ComprobantePedido> findByPedido_Id(Long idPedido);
}
