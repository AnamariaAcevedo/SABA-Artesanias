package com.marketplace.marketplace_backend.modules.pedido;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Collection;

// Acceso a datos de ProductoPedido (lineas de un pedido)
public interface ProductoPedidoRepository extends JpaRepository<ProductoPedido, Long> {
    List<ProductoPedido> findByPedido_IdOrderByIdAsc(Long idPedido);

    // Lineas del producto en pedidos con alguno de esos estados (p. ej. los que siguen en curso).
    long countByProducto_IdAndPedido_EstadoIn(Long idProducto, Collection<EstadoPedido> estados);
}
