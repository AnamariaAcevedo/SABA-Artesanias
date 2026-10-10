package com.marketplace.marketplace_backend.modules.pedido;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// Acceso a datos de ProductoPedido (lineas de un pedido)
public interface ProductoPedidoRepository extends JpaRepository<ProductoPedido, Long> {
    List<ProductoPedido> findByPedido_IdOrderByIdAsc(Long idPedido);
}
