package com.marketplace.marketplace_backend.modules.contacto.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para crear un contacto nuevo de una tienda
public class ContactoCreateRequestDto {

    @NotBlank(message = "El enlace no puede estar vacío")
    @Size(max = 255, message = "El enlace no puede tener más de 255 caracteres")
    @Pattern(regexp = "^https?://.+", message = "El enlace debe ser una URL válida (http:// o https://)")
    private String enlace;

    @NotBlank(message = "El usuario no puede estar vacío")
    @Size(max = 100, message = "El usuario no puede tener más de 100 caracteres")
    private String usuario;

    @Pattern(regexp = "^[0-9+ -]{6,20}$", message = "El número de teléfono no tiene un formato válido")
    private String nroTelefono;

    @NotNull(message = "El tipo de contacto es obligatorio")
    private Long idTipoContacto;

    @NotNull(message = "La tienda es obligatoria")
    private Long idTienda;
}
