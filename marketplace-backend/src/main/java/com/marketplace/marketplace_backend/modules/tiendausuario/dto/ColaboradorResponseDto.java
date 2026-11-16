package com.marketplace.marketplace_backend.modules.tiendausuario.dto;

import com.marketplace.marketplace_backend.modules.tiendausuario.TipoVinculoTienda;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// Integrante del equipo de una tienda: el dueño (PRINCIPAL) o un colaborador (SECUNDARIO).
// `id` es el del vinculo tienda_usuario, que es lo que se usa para quitarlo.
public class ColaboradorResponseDto {
    private Long id;
    private Long idUsuario;
    private String usuario;
    private String nombre;
    private String apellido;
    private String email;
    private TipoVinculoTienda tipo;
    private LocalDateTime fechaAlta;
}
