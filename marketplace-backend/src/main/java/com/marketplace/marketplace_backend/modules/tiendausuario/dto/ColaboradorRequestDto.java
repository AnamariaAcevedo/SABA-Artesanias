package com.marketplace.marketplace_backend.modules.tiendausuario.dto;

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
// DTO para agregar un colaborador a la propia tienda a partir de su nombre de usuario
public class ColaboradorRequestDto {

    @NotBlank(message = "Ingresá el nombre de usuario")
    @Size(max = 255, message = "El nombre de usuario no puede tener más de 255 caracteres")
    private String usuario;
}
