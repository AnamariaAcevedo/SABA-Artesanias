package com.marketplace.marketplace_backend.modules.departamento.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para actualizar nombre y/o pais de un departamento existente
public class DepartamentoUpdateRequestDto {

    @Size(max = 50, message = "El nombre no puede tener más de 50 caracteres")
    private String nombre;

    private Long idPais;
}
