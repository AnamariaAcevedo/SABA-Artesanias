package com.marketplace.marketplace_backend.modules.pedido;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.pedido.dto.PedidoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.pedido.dto.PedidoResponseDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/pedidos")
@RestController
// Endpoints para crear un pedido (usuario registrado o invitado), consultar y cancelar los
// propios (solo registrados), y listar todos (administracion)
public class PedidoController {

    private final PedidoService pedidoService;

    // El comprobante viaja junto con el pedido: un invitado no tiene sesion para subirlo despues.
    // Es obligatorio, pero lo valida el service para responder con un mensaje claro.
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAnonymous() or hasAuthority('CREATE_MIS_COMPRAS')")
    public ResponseEntity<StandardResponseDto<PedidoResponseDto>> crear(
            @Valid @RequestPart("pedido") PedidoCreateRequestDto request,
            @RequestPart(value = "comprobante", required = false) MultipartFile comprobante) {
        return ok(pedidoService.crear(request, comprobante));
    }

    @GetMapping("/mios")
    @PreAuthorize("hasAuthority('LIST_MIS_COMPRAS')")
    public ResponseEntity<StandardResponseDto<List<PedidoResponseDto>>> listarMios(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int perPage) {
        StandardResponseDto<List<PedidoResponseDto>> response = new StandardResponseDto<>();
        var resultado = pedidoService.listarMios(page, perPage);
        response.setSuccess(true);
        response.setData(resultado.data());
        response.setErrors(null);
        response.setPagination(new Pagination(resultado.page(), resultado.perPage(), resultado.total()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/mios/{id}")
    @PreAuthorize("hasAuthority('LIST_MIS_COMPRAS')")
    public ResponseEntity<StandardResponseDto<PedidoResponseDto>> obtenerMio(@PathVariable Long id) {
        return ok(pedidoService.obtenerMio(id));
    }

    @PutMapping("/mios/{id}/cancelar")
    @PreAuthorize("hasAuthority('UPDATE_MIS_COMPRAS')")
    public ResponseEntity<StandardResponseDto<PedidoResponseDto>> cancelarMio(@PathVariable Long id) {
        return ok(pedidoService.cancelarMio(id));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('LIST_PEDIDOS')")
    public ResponseEntity<StandardResponseDto<List<PedidoResponseDto>>> listarTodos(
            @RequestParam(required = false) Long idTienda,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int perPage) {
        StandardResponseDto<List<PedidoResponseDto>> response = new StandardResponseDto<>();
        var resultado = pedidoService.listarTodos(idTienda, page, perPage);
        response.setSuccess(true);
        response.setData(resultado.data());
        response.setErrors(null);
        response.setPagination(new Pagination(resultado.page(), resultado.perPage(), resultado.total()));
        return ResponseEntity.ok(response);
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
