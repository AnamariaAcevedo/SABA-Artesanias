package com.marketplace.marketplace_backend.modules.recuperacion;

import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.recuperacion.dto.ConfirmarRecuperacionRequestDto;
import com.marketplace.marketplace_backend.modules.recuperacion.dto.SolicitarRecuperacionRequestDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@AllArgsConstructor
@RequestMapping("/recuperar")
@RestController
// Endpoints públicos para recuperar la contraseña por correo
public class RecuperacionController {

    private final RecuperacionService recuperacionService;

    @PostMapping
    public ResponseEntity<StandardResponseDto<Void>> solicitar(@Valid @RequestBody SolicitarRecuperacionRequestDto request) {
        recuperacionService.solicitar(request.getEmail());
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/confirmar")
    public ResponseEntity<StandardResponseDto<Void>> confirmar(@Valid @RequestBody ConfirmarRecuperacionRequestDto request) {
        recuperacionService.confirmar(request.getToken(), request.getContrasenhaNueva());
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
