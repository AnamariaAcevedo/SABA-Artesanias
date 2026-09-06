package com.marketplace.marketplace_backend.modules.usuario.dto;

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
// DTO para crear un usuario nuevo
public class UsuarioCreateRequestDto {

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

    @NotNull(message = "El rol es obligatorio")
    private Long idRol;

    @NotBlank(message = "El contacto no puede estar vacío")
    private String contacto;

    @NotNull(message = "La dirección es obligatoria")
    private Long idDireccion;
}
