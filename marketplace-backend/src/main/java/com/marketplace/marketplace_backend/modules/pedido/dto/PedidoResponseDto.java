package com.marketplace.marketplace_backend.modules.pedido.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO de respuesta con los datos de un pedido, su entrega y sus lineas
public class PedidoResponseDto {
    private Long id;
    private Long idTienda;
    private String nombreTienda;
    // Null si el pedido lo hizo un invitado sin cuenta.
    private Long idUsuario;
    private String nombreReceptor;
    private String telefonoReceptor;
    private String emailReceptor;
    private Long idBarrio;
    private String nombreBarrio;
    private String direccion;
    private String referencia;
    private Double total;
    private String estado;
    private LocalDateTime fechaPedido;
    private LocalDateTime fechaEntrega;
    private List<ProductoPedidoResponseDto> items;
}
