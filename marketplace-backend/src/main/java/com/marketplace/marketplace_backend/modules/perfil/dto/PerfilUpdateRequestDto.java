package com.marketplace.marketplace_backend.modules.perfil.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
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
// DTO para que el usuario autenticado edite su propio perfil. No permite cambiar
// rol ni estado (eso queda para la administracion de usuarios).
public class PerfilUpdateRequestDto {

    @NotBlank(message = "El nombre no puede estar vacío")
    private String nombre;

    @NotBlank(message = "El apellido no puede estar vacío")
    private String apellido;

    @NotBlank(message = "El email no puede estar vacío")
    @Email(message = "El email no tiene un formato válido")
    private String email;

    @NotBlank(message = "El usuario no puede estar vacío")
    private String usuario;

    @NotBlank(message = "El teléfono no puede estar vacío")
    @Pattern(regexp = "^0\\d{8,9}$", message = "El teléfono debe empezar con 0 y tener 9 o 10 dígitos, sin espacios")
    private String telefono;

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
}
