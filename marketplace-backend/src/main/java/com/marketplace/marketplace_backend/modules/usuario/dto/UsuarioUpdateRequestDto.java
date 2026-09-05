package com.marketplace.marketplace_backend.modules.usuario.dto;

import jakarta.validation.constraints.Email;
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

    private Long idRol;

    private String contacto;

    private Boolean activo;
}
