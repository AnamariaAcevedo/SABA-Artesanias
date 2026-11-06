package com.marketplace.marketplace_backend.modules.mitienda.dto;

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
// DTO para que el dueño edite los datos y la direccion de su tienda
public class MiTiendaUpdateRequestDto {

    @NotBlank(message = "El nombre no puede estar vacío")
    @Size(max = 100, message = "El nombre no puede tener más de 100 caracteres")
    private String nombre;

    @NotBlank(message = "La descripción no puede estar vacía")
    @Size(max = 255, message = "La descripción no puede tener más de 255 caracteres")
    private String descripcion;

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

    // Opcional: si no viene, se mantiene el barrio actual.
    @Positive(message = "El barrio seleccionado no es válido")
    private Long idBarrio;

    @NotBlank(message = "El banco es obligatorio")
    @Size(max = 100, message = "El banco no puede tener más de 100 caracteres")
    private String banco;

    @NotBlank(message = "El titular de la cuenta es obligatorio")
    @Size(max = 150, message = "El titular no puede tener más de 150 caracteres")
    private String titularCuenta;

    @NotBlank(message = "La cédula o RUC del titular es obligatorio")
    @Size(max = 30, message = "La cédula o RUC no puede tener más de 30 caracteres")
    private String documentoTitular;

    // Numero de cuenta local: el service lo completa con ceros a la izquierda hasta 9 digitos.
    @NotNull(message = "El número de cuenta es obligatorio")
    @Pattern(regexp = "\\d{1,9}", message = "El número de cuenta debe tener solo dígitos, hasta 9")
    private String nroCuenta;

    @Size(max = 100, message = "El alias no puede tener más de 100 caracteres")
    private String aliasCuenta;
}
