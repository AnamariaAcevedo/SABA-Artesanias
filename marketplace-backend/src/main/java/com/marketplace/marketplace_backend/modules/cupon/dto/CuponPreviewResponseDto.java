package com.marketplace.marketplace_backend.modules.cupon.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta al validar un cupon antes de confirmar la compra (vista previa, sin crear el pedido)
public class CuponPreviewResponseDto {
    private String codigo;
    private String nombre;
    private Double porcentaje;
}
