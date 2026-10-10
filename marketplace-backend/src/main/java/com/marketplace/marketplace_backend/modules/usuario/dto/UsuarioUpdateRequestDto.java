package com.marketplace.marketplace_backend.modules.usuario.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para actualizar los datos de un usuario existente
public class UsuarioUpdateRequestDto {

    @Pattern(regexp = ".*\\S.*", message = "El nombre no puede estar vacío")
    private String nombre;

    @Pattern(regexp = ".*\\S.*", message = "El apellido no puede estar vacío")
    private String apellido;

    @Email(message = "El email no tiene un formato válido")
    @Pattern(regexp = ".*\\S.*", message = "El email no puede estar vacío")
    private String email;

    @Pattern(regexp = ".*\\S.*", message = "El usuario no puede estar vacío")
    private String usuario;

    @Pattern(regexp = "^0\\d{8,9}$", message = "El teléfono debe empezar con 0 y tener 9 o 10 dígitos, sin espacios")
    private String telefono;

    @Positive(message = "El rol seleccionado no es válido")
    private Long idRol;

    private Boolean activo;

    @Positive(message = "La dirección seleccionada no es válida")
    private Long idDireccion;
}
