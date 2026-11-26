package com.marketplace.marketplace_backend.modules.tienda.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para actualizar los datos de una tienda existente
public class TiendaUpdateRequestDto {

    @Size(max = 100, message = "El nombre no puede tener más de 100 caracteres")
    private String nombre;

    private String descripcion;

    private Long idDireccion;
}
