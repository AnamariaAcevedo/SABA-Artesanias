package com.marketplace.marketplace_backend.modules.tiendausuario;

import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.tiendausuario.dto.ColaboradorRequestDto;
import com.marketplace.marketplace_backend.modules.tiendausuario.dto.ColaboradorResponseDto;
import com.marketplace.marketplace_backend.modules.tiendausuario.dto.UsuarioDisponibleDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/mi-tienda/colaboradores")
@RestController
// Equipo de la propia tienda. Ademas del permiso, el service exige que quien llama
// sea el dueño (vinculo PRINCIPAL) de la tienda.
public class ColaboradorTiendaController {

    private final ColaboradorTiendaService colaboradorTiendaService;

    @GetMapping
    @PreAuthorize("hasAuthority('LIST_MIS_COLABORADORES')")
    public ResponseEntity<StandardResponseDto<List<ColaboradorResponseDto>>> listar() {
        return ok(colaboradorTiendaService.listar());
    }

    @GetMapping("/sugerencias")
    @PreAuthorize("hasAuthority('CREATE_MIS_COLABORADORES')")
    public ResponseEntity<StandardResponseDto<List<UsuarioDisponibleDto>>> sugerir(
            @RequestParam String usuario,
            @RequestParam(defaultValue = "6") int limite) {
        return ok(colaboradorTiendaService.sugerir(usuario, limite));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_MIS_COLABORADORES')")
    public ResponseEntity<StandardResponseDto<ColaboradorResponseDto>> agregar(@Valid @RequestBody ColaboradorRequestDto request) {
        return ok(colaboradorTiendaService.agregar(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_MIS_COLABORADORES')")
    public ResponseEntity<StandardResponseDto<Void>> quitar(@PathVariable Long id) {
        colaboradorTiendaService.quitar(id);
        return ok(null);
    }

    private <T> ResponseEntity<StandardResponseDto<T>> ok(T data) {
        StandardResponseDto<T> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(data);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
