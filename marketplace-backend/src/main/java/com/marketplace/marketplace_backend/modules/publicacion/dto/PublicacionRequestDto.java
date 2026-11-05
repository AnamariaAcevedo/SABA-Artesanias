package com.marketplace.marketplace_backend.modules.publicacion.dto;

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
// DTO para crear o editar una publicacion de la propia tienda. No incluye la tienda
// (se toma del vinculo del usuario).
public class PublicacionRequestDto {

    @NotBlank(message = "El título no puede estar vacío")
    @Size(max = 150, message = "El título no puede superar los 150 caracteres")
    private String titulo;

    @NotBlank(message = "El contenido no puede estar vacío")
    private String contenido;

    // Cupon que esta publicacion promociona (opcional, debe ser de la misma tienda).
    private Long idCupon;
}
