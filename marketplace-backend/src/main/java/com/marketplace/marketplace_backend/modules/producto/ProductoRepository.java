package com.marketplace.marketplace_backend.modules.producto;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;

// Acceso a datos de Producto: CRUD y búsquedas por nombre/tienda/subcategoria
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    // Stock bajo del dashboard: solo lo que esta a la venta (producto y tienda activos);
    // un producto desactivado no se va a reponer, asi que no es una alerta.
    long countByCantidadDisponibleLessThanEqualAndActivoTrueAndTienda_ActivoTrue(Integer cantidadDisponible);

    // Catalogo y listados: cada filtro se aplica solo si su indicador viene en true.
    // `nombre` llega en minusculas y con los comodines de LIKE escapados ("" = sin filtro).
    @Query("""
            SELECT producto FROM Producto producto
            WHERE LOWER(producto.nombre) LIKE CONCAT('%', :nombre, '%') ESCAPE '\\'
              AND (:filtrarTienda = false OR producto.tienda.id = :idTienda)
              AND (:filtrarIds = false OR producto.id IN :ids)
              AND (:soloActivos = false OR (producto.activo = true AND producto.tienda.activo = true))
            ORDER BY producto.id ASC
            """)
    Page<Producto> buscar(
            @Param("nombre") String nombre,
            @Param("filtrarTienda") boolean filtrarTienda,
            @Param("idTienda") Long idTienda,
            @Param("filtrarIds") boolean filtrarIds,
            @Param("ids") List<Long> ids,
            @Param("soloActivos") boolean soloActivos,
            Pageable pageable);

    // Devuelve stock al cancelar un pedido confirmado. Es SQL directo porque el producto
    // puede estar eliminado, y las consultas JPA ocultan los eliminados.
    @Modifying
    @Query(value = "UPDATE producto SET cantidad_disponible = cantidad_disponible + :cantidad WHERE id = :id",
            nativeQuery = true)
    int devolverStock(@Param("id") Long id, @Param("cantidad") int cantidad);

    long countByTienda_Id(Long idTienda);
}
