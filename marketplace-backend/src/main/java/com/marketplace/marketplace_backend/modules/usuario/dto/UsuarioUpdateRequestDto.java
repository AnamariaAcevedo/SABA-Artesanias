package com.marketplace.marketplace_backend.modules.usuario.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
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

    private String nombre;

    private String apellido;

    @Email(message = "El email no tiene un formato válido")
    private String email;

    private String usuario;

    @Pattern(regexp = "^0\\d{8,9}$", message = "El teléfono debe empezar con 0 y tener 9 o 10 dígitos, sin espacios")
    private String telefono;

    private Long idRol;

    private Boolean activo;

    private Long idDireccion;
}
