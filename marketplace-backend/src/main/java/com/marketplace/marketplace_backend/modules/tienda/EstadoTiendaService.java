package com.marketplace.marketplace_backend.modules.tienda;

import com.marketplace.marketplace_backend.modules.tienda.dto.TiendaResponseDto;

// Desactivar y eliminar tiendas: las operaciones que afectan a todo lo que depende de
// la tienda (productos, pedidos, equipo). Las usan el administrador y el dueño.
public interface EstadoTiendaService {

    // Activa o desactiva la tienda. Desactivar exige que no tenga pedidos pendientes.
    TiendaResponseDto cambiarActivo(Long idTienda, boolean activo);

    // Solo para tiendas sin productos ni pedidos (p. ej. de prueba o creadas por error).
    // Da de baja tambien lo que depende de ella y devuelve a su equipo al rol Cliente.
    void eliminar(Long idTienda);
}
