package com.marketplace.marketplace_backend.modules.mitienda.dto;

import jakarta.validation.constraints.NotBlank;
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
    private Long idBarrio;
}
