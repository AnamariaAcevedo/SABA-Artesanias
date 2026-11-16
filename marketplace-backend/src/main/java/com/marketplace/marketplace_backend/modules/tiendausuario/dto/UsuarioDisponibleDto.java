package com.marketplace.marketplace_backend.modules.tiendausuario.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// Sugerencia del buscador de colaboradores: solo los datos minimos para reconocer a la
// persona y, si no se puede agregar, el motivo (null cuando esta disponible).
public class UsuarioDisponibleDto {
    private String usuario;
    private String nombre;
    private String apellido;
    private String motivoNoDisponible;
}
