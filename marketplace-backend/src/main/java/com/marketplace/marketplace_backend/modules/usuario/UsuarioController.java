package com.marketplace.marketplace_backend.modules.usuario;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.usuario.dto.UsuarioCreateRequestDto;
import com.marketplace.marketplace_backend.modules.usuario.dto.UsuarioFilterDto;
import com.marketplace.marketplace_backend.modules.usuario.dto.UsuarioResponseDto;
import com.marketplace.marketplace_backend.modules.usuario.dto.UsuarioUpdateRequestDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/usuarios")
@RestController
// Endpoints REST para la gestión de usuarios
public class UsuarioController {

    private final UsuarioService usuarioService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_USUARIOS')")
    public ResponseEntity<StandardResponseDto<UsuarioResponseDto>> create(@Valid @RequestBody UsuarioCreateRequestDto request) {
        StandardResponseDto<UsuarioResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(usuarioService.create(request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_USUARIOS')")
    public ResponseEntity<StandardResponseDto<UsuarioResponseDto>> update(@PathVariable Long id, @Valid @RequestBody UsuarioUpdateRequestDto request) {
        StandardResponseDto<UsuarioResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(usuarioService.update(id, request));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GET_USUARIOS')")
    public ResponseEntity<StandardResponseDto<UsuarioResponseDto>> get(@PathVariable Long id) {
        StandardResponseDto<UsuarioResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(usuarioService.get(id));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('LIST_USUARIOS')")
    public ResponseEntity<StandardResponseDto<List<UsuarioResponseDto>>> findAll(@ModelAttribute UsuarioFilterDto filter) {
        StandardResponseDto<List<UsuarioResponseDto>> response = new StandardResponseDto<>();
        var result = usuarioService.findAll(filter);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_USUARIOS')")
    public ResponseEntity<StandardResponseDto<Void>> delete(@PathVariable Long id) {
        StandardResponseDto<Void> response = new StandardResponseDto<>();
        usuarioService.delete(id);
        response.setSuccess(true);
        response.setData(null);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/options")
    @PreAuthorize("hasAuthority('OPTIONS_USUARIOS')")
    public ResponseEntity<StandardResponseDto<List<UsuarioResponseDto>>> findAllOptions() {
        StandardResponseDto<List<UsuarioResponseDto>> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(usuarioService.findAllOptions());
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
