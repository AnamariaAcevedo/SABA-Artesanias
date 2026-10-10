package com.marketplace.marketplace_backend.modules.solicitudvendedor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para que un usuario solicite ser vendedor, con los datos propuestos de su tienda
public class SolicitudVendedorRequestDto {

    @NotBlank(message = "El nombre de la tienda no puede estar vacío")
    @Size(max = 100, message = "El nombre de la tienda no puede superar los 100 caracteres")
    private String nombreTienda;

    @NotBlank(message = "La descripción de la tienda no puede estar vacía")
    private String descripcionTienda;

    @NotBlank(message = "La calle no puede estar vacía")
    @Size(max = 100, message = "La calle no puede superar los 100 caracteres")
    private String calle;

    @Size(max = 100, message = "El nombre de edificio no puede superar los 100 caracteres")
    private String nombreEdificio;

    // Si no hay nombreEdificio, nroCasa es obligatorio.
    // Si hay nombreEdificio, nroDepartamento es obligatorio.
    // (se valida en el service, porque depende del otro campo).
    private Integer nroCasa;

    @Size(max = 50, message = "El número de departamento no puede superar los 50 caracteres")
    private String nroDepartamento;

    @NotNull(message = "El barrio es obligatorio")
    @Positive(message = "El barrio seleccionado no es válido")
    private Long idBarrio;

    @NotBlank(message = "El número de WhatsApp es obligatorio")
    @Pattern(regexp = "^0\\d{8,9}$", message = "El WhatsApp debe empezar con 0 y tener 9 o 10 dígitos, sin espacios")
    private String telefono;
}
