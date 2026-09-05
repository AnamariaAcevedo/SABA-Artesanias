package com.marketplace.marketplace_backend.modules.auth;

import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.auth.dto.AuthResponseDto;
import com.marketplace.marketplace_backend.modules.auth.dto.LoginRequestDto;
import com.marketplace.marketplace_backend.modules.auth.dto.RefreshRequestDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@AllArgsConstructor
// Endpoints REST de autenticación: login y refresh de tokens
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<StandardResponseDto<AuthResponseDto>> login(@Valid @RequestBody LoginRequestDto request) {
        StandardResponseDto<AuthResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(authService.authenticateAndGenerateToken(request.getUsuario(), request.getContrasenha()));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<StandardResponseDto<AuthResponseDto>> refresh(@Valid @RequestBody RefreshRequestDto request) {
        StandardResponseDto<AuthResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(authService.generateRefreshToken(request.getRefreshToken(), request.getAccessToken()));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
