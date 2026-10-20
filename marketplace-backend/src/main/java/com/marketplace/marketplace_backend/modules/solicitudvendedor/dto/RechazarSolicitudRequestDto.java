package com.marketplace.marketplace_backend.modules.solicitudvendedor.dto;

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
// DTO para rechazar una solicitud indicando el motivo
public class RechazarSolicitudRequestDto {

    @NotBlank(message = "El motivo del rechazo no puede estar vacío")
    @Size(max = 500, message = "El motivo no puede superar los 500 caracteres")
    private String motivo;
}
