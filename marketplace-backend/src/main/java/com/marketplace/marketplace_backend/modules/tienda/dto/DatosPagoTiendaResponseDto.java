package com.marketplace.marketplace_backend.modules.tienda.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO con los datos de cuenta de una tienda, para que el cliente sepa a donde transferir.
// Va separado de TiendaResponseDto para no incluirlos en cada listado de tiendas.
public class DatosPagoTiendaResponseDto {
    private String banco;
    private String titularCuenta;
    private String documentoTitular;
    private String nroCuenta;
    private String aliasCuenta;
}
