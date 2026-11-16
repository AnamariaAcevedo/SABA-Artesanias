package com.marketplace.marketplace_backend.modules.tiendausuario;

import com.marketplace.marketplace_backend.modules.tiendausuario.dto.ColaboradorRequestDto;
import com.marketplace.marketplace_backend.modules.tiendausuario.dto.ColaboradorResponseDto;
import com.marketplace.marketplace_backend.modules.tiendausuario.dto.UsuarioDisponibleDto;

import java.util.List;

// Equipo de la tienda del usuario autenticado. Solo el dueño (vinculo PRINCIPAL)
// puede ver, agregar y quitar colaboradores (vinculo SECUNDARIO).
public interface ColaboradorTiendaService {

    List<ColaboradorResponseDto> listar();

    // Usuarios cuyo nombre de usuario empieza con `texto`, con el motivo si no se pueden agregar.
    List<UsuarioDisponibleDto> sugerir(String texto, int limite);

    // Vincula al usuario como SECUNDARIO y le asigna el rol VendedorSecundario.
    ColaboradorResponseDto agregar(ColaboradorRequestDto request);

    // Quita el vinculo (borrado logico) y devuelve al usuario al rol Cliente.
    void quitar(Long idVinculo);
}
