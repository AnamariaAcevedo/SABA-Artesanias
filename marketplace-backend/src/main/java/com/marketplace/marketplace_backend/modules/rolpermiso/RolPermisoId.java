package com.marketplace.marketplace_backend.modules.rolpermiso;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode
// Clave compuesta de RolPermiso: combinación de rol y permiso
public class RolPermisoId implements Serializable {
    private Long rolId;
    private Long permisoId;
}
