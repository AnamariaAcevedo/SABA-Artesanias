package com.marketplace.marketplace_backend.modules.pedido;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.time.LocalDate;
import java.time.LocalDateTime;

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

    Page<Pedido> findAllByOrderByFechaPedidoDesc(Pageable pageable);

    long countByEstado(EstadoPedido estado);

    long countByEstadoAndFechaPedidoGreaterThanEqualAndFechaPedidoLessThan(
            EstadoPedido estado,
            LocalDateTime desde,
            LocalDateTime hasta
    );

    long countByEstadoInAndFechaPedidoGreaterThanEqualAndFechaPedidoLessThan(
            List<EstadoPedido> estados,
            LocalDateTime desde,
            LocalDateTime hasta
    );

    @Query("SELECT COALESCE(SUM(p.total), 0) FROM Pedido p "
            + "WHERE p.estado IN :estados AND p.fechaPedido >= :desde AND p.fechaPedido < :hasta")
    Double sumarVentas(
            @Param("estados") List<EstadoPedido> estados,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta
    );

    @Query(value = """
            SELECT CAST(p.fecha_pedido AS date) AS "fecha",
                   COUNT(p.id) AS "pedidos",
                   COALESCE(SUM(p.total), 0) AS "total"
            FROM pedido p
            WHERE p.deleted_at IS NULL
              AND p.estado IN ('CONFIRMADO', 'ENVIADO', 'ENTREGADO')
              AND p.fecha_pedido >= :desde
              AND p.fecha_pedido < :hasta
            GROUP BY CAST(p.fecha_pedido AS date)
            ORDER BY CAST(p.fecha_pedido AS date)
            """, nativeQuery = true)
    List<VentaDiariaProjection> resumirVentasDiarias(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta
    );

    @Query(value = """
            SELECT t.id AS "idTienda",
                   t.nombre AS "nombreTienda",
                   COUNT(p.id) FILTER (
                       WHERE p.estado IN ('CONFIRMADO', 'ENVIADO', 'ENTREGADO')
                         AND p.fecha_pedido >= :desde AND p.fecha_pedido < :hasta
                   ) AS "pedidos",
                   COALESCE(SUM(p.total) FILTER (
                       WHERE p.estado IN ('CONFIRMADO', 'ENVIADO', 'ENTREGADO')
                         AND p.fecha_pedido >= :desde AND p.fecha_pedido < :hasta
                   ), 0) AS "totalVendido",
                   COUNT(p.id) FILTER (WHERE p.estado = 'PENDIENTE') AS "pendientes"
            FROM tienda t
            LEFT JOIN pedido p ON p.tienda_id = t.id AND p.deleted_at IS NULL
            WHERE t.deleted_at IS NULL
            GROUP BY t.id, t.nombre
            ORDER BY "totalVendido" DESC, t.nombre
            LIMIT 5
            """, nativeQuery = true)
    List<ResumenTiendaProjection> resumirTiendas(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta
    );

    boolean existsByUsuario_IdAndCupon_Id(Long idUsuario, Long idCupon);

    long countByCupon_Id(Long idCupon);

    interface VentaDiariaProjection {
        LocalDate getFecha();
        Long getPedidos();
        Double getTotal();
    }

    interface ResumenTiendaProjection {
        Long getIdTienda();
        String getNombreTienda();
        Long getPedidos();
        Double getTotalVendido();
        Long getPendientes();
    }
}
