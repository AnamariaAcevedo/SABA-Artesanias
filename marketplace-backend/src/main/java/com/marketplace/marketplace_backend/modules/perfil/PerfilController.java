package com.marketplace.marketplace_backend.modules.perfil;

import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.perfil.dto.PerfilActualizadoResponseDto;
import com.marketplace.marketplace_backend.modules.perfil.dto.PerfilResponseDto;
import com.marketplace.marketplace_backend.modules.perfil.dto.PerfilUpdateRequestDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@AllArgsConstructor
@RequestMapping("/perfil")
@RestController
// Endpoints REST del perfil propio: cualquier usuario autenticado puede ver y
// editar sus datos, sin necesitar permisos de administracion de usuarios.
public class PerfilController {

    private final PerfilService perfilService;

    @GetMapping
    public ResponseEntity<StandardResponseDto<PerfilResponseDto>> obtener() {
        StandardResponseDto<PerfilResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(perfilService.obtenerPerfil());
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<StandardResponseDto<PerfilActualizadoResponseDto>> actualizar(@Valid @RequestBody PerfilUpdateRequestDto request) {
        StandardResponseDto<PerfilActualizadoResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(perfilService.actualizarPerfil(request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
