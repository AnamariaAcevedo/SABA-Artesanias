package com.marketplace.marketplace_backend.modules.rol.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// DTO para crear/actualizar un rol junto con sus cambios de permisos, todo en una sola operación
public class RolConPermisosRequestDto {

    @NotBlank(message = "El nombre del rol no puede estar vacío")
    @Size(max = 50, message = "El nombre no puede tener más de 50 caracteres")
    private String nombre;

    private Boolean activo;

    private List<Long> permisoIdsAgregar;

    private List<Long> permisoIdsQuitar;
}
