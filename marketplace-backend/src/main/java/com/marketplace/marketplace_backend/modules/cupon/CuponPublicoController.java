package com.marketplace.marketplace_backend.modules.cupon;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.cupon.dto.CuponPublicoResponseDto;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/cupones")
@RestController
// Catalogo publico de cupones vigentes de todas las tiendas, para que cualquier visitante
// los vea y obtenga el codigo. La gestion por tienda vive en /mi-tienda/cupones.
public class CuponPublicoController {

    private final CuponService cuponService;

    @GetMapping
    public ResponseEntity<StandardResponseDto<List<CuponPublicoResponseDto>>> listarVigentes(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int perPage) {
        StandardResponseDto<List<CuponPublicoResponseDto>> response = new StandardResponseDto<>();
        var resultado = cuponService.listarVigentes(page, perPage);
        response.setSuccess(true);
        response.setData(resultado.data());
        response.setErrors(null);
        response.setPagination(new Pagination(resultado.page(), resultado.perPage(), resultado.total()));
        return ResponseEntity.ok(response);
    }
}
