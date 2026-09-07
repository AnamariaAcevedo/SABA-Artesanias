package com.marketplace.marketplace_backend.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para el auto-registro de un cliente nuevo. Los datos de la direccion
// vienen embebidos (no un idDireccion existente): se crea junto con el usuario.
public class RegistroRequestDto {

    @NotBlank(message = "El nombre no puede estar vacío")
    private String nombre;

    @NotBlank(message = "El apellido no puede estar vacío")
    private String apellido;

    @NotBlank(message = "La contraseña no puede estar vacía")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    private String contrasenha;

    @NotBlank(message = "El email no puede estar vacío")
    @Email(message = "El email no tiene un formato válido")
    private String email;

    @NotBlank(message = "El usuario no puede estar vacío")
    private String usuario;

    @NotBlank(message = "La calle no puede estar vacía")
    private String calle;

    private String nombreEdificio;

    // Si no hay nombreEdificio, nroCasa es obligatorio.
    // Si hay nombreEdificio, nroDepartamento es obligatorio.
    // (se valida en el service, porque depende del otro campo).
    private Integer nroCasa;

    private String nroDepartamento;

    @NotNull(message = "El barrio es obligatorio")
    private Long idBarrio;
}
