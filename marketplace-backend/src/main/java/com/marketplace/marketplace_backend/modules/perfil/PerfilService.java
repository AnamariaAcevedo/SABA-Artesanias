package com.marketplace.marketplace_backend.modules.perfil;

import com.marketplace.marketplace_backend.modules.perfil.dto.PerfilActualizadoResponseDto;
import com.marketplace.marketplace_backend.modules.perfil.dto.PerfilContrasenhaRequestDto;
import com.marketplace.marketplace_backend.modules.perfil.dto.PerfilResponseDto;
import com.marketplace.marketplace_backend.modules.perfil.dto.PerfilUpdateRequestDto;

// Operaciones de negocio sobre el perfil del usuario autenticado
public interface PerfilService {
    PerfilResponseDto obtenerPerfil();

    PerfilActualizadoResponseDto actualizarPerfil(PerfilUpdateRequestDto request);

    void cambiarContrasenha(PerfilContrasenhaRequestDto request);
}
