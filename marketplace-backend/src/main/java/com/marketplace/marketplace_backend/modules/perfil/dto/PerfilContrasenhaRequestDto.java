package com.marketplace.marketplace_backend.modules.perfil.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
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
// DTO para que el usuario autenticado cambie su propia contraseña
public class PerfilContrasenhaRequestDto {

    @NotBlank(message = "La contraseña actual no puede estar vacía")
    private String contrasenhaActual;

    @NotBlank(message = "La contraseña nueva no puede estar vacía")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    private String contrasenhaNueva;

    @NotBlank(message = "La confirmación de contraseña no puede estar vacía")
    private String confirmarContrasenhaNueva;

    @JsonIgnore
    @AssertTrue(message = "Las contraseñas nuevas no coinciden")
    public boolean isConfirmacionContrasenhaValida() {
        return contrasenhaNueva != null && contrasenhaNueva.equals(confirmarContrasenhaNueva);
    }
}
