package com.marketplace.marketplace_backend.modules.pedido.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para crear un pedido. Todos los productos deben pertenecer a idTienda.
// Los datos de entrega (nombreReceptor/telefonoReceptor/emailReceptor/idBarrio/direccion) son
// opcionales aca: si hay un usuario autenticado y no vienen, se completan con los datos de su
// cuenta/direccion; si es un invitado, el service los exige.
public class PedidoCreateRequestDto {

    @NotNull(message = "La tienda es obligatoria")
    private Long idTienda;

    @NotEmpty(message = "El pedido debe tener al menos un producto")
    @Valid
    private List<PedidoItemRequestDto> items;

    private String nombreReceptor;

    @Pattern(regexp = "^0\\d{8,9}$", message = "El teléfono debe empezar con 0 y tener 9 o 10 dígitos, sin espacios")
    private String telefonoReceptor;

    @Email(message = "El email no tiene un formato válido")
    private String emailReceptor;

    private Long idBarrio;

    private String direccion;

    private String referencia;
}
