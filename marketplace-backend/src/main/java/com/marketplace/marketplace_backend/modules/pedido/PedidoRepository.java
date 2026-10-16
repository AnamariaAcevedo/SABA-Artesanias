package com.marketplace.marketplace_backend.modules.pedido;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

// Acceso a datos de Pedido
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    Page<Pedido> findByUsuario_IdOrderByIdDesc(Long idUsuario, Pageable pageable);

    Optional<Pedido> findByIdAndUsuario_Id(Long id, Long idUsuario);

    Page<Pedido> findByTienda_IdOrderByIdDesc(Long idTienda, Pageable pageable);

    Page<Pedido> findByTienda_IdAndNumeroOrderByIdDesc(Long idTienda, Integer numero, Pageable pageable);

    @Query("SELECT COALESCE(MAX(p.numero), 0) FROM Pedido p WHERE p.tienda.id = :idTienda")
    int maxNumeroDeTienda(@Param("idTienda") Long idTienda);

    // Pedidos de la tienda cuyo numero empieza con los digitos dados ("1" -> 1, 10, 12...).
    @Query("SELECT p FROM Pedido p WHERE p.tienda.id = :idTienda "
            + "AND CAST(p.numero AS string) LIKE CONCAT(:prefijo, '%') ORDER BY p.numero")
    List<Pedido> buscarPorPrefijoDeNumero(@Param("idTienda") Long idTienda, @Param("prefijo") String prefijo, Pageable pageable);

    Optional<Pedido> findByIdAndTienda_Id(Long id, Long idTienda);

    Page<Pedido> findAllByOrderByIdDesc(Pageable pageable);
}
