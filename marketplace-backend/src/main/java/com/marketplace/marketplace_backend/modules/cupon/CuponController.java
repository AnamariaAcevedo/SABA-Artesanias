package com.marketplace.marketplace_backend.modules.cupon;

import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.cupon.dto.CuponPreviewResponseDto;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@AllArgsConstructor
@RequestMapping("/tiendas/{idTienda}/cupones")
@RestController
// Endpoint publico para que el comprador valide un cupon antes de confirmar la compra
// (vista previa en el carrito, no crea ningun pedido).
public class CuponController {

    private final CuponService cuponService;

    @GetMapping("/validar")
    public ResponseEntity<StandardResponseDto<CuponPreviewResponseDto>> validar(
            @PathVariable Long idTienda,
            @RequestParam String codigo) {
        StandardResponseDto<CuponPreviewResponseDto> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(cuponService.validar(idTienda, codigo));
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
