package com.marketplace.marketplace_backend.modules.rol;

import com.marketplace.marketplace_backend.modules.permiso.PermisoRepository;
import com.marketplace.marketplace_backend.modules.rol.dto.RolConPermisosRequestDto;
import com.marketplace.marketplace_backend.modules.rol.dto.RolUpdateRequestDto;
import com.marketplace.marketplace_backend.modules.rolpermiso.RolPermisoRepository;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// Los roles del sistema no se pueden desactivar, renombrar ni eliminar; un rol propio
// no se elimina mientras alguien lo tenga.
class RolServiceImplTests {

    private final RolRepository rolRepository = mock(RolRepository.class);
    private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
    private final RolServiceImpl service = new RolServiceImpl(
            rolRepository,
            mock(RolPermisoRepository.class),
            mock(PermisoRepository.class),
            usuarioRepository);

    @Test
    void noDesactivaUnRolDelSistema() {
        Rol rol = rol(4L, "Administrador");

        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> service.update(4L, new RolUpdateRequestDto(null, false)));

        assertEquals("No se puede desactivar el rol Administrador: lo usa el sistema.", error.getMessage());
        assertTrue(rol.getActivo());
        verify(rolRepository, never()).save(any());
    }

    @Test
    void noDesactivaUnRolDelSistemaDesdeElFormularioCompleto() {
        rol(3L, "Cliente");

        assertThrows(IllegalStateException.class, () -> service.actualizarConPermisos(3L,
                new RolConPermisosRequestDto("Cliente", false, List.of(), List.of())));
        verify(rolRepository, never()).save(any());
    }

    @Test
    void noRenombraUnRolDelSistemaNiSoloEnMayusculas() {
        Rol rol = rol(1L, "VendedorPrincipal");

        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> service.update(1L, new RolUpdateRequestDto("vendedorprincipal", null)));

        assertEquals("No se puede cambiar el nombre del rol VendedorPrincipal: lo usa el sistema.", error.getMessage());
        assertEquals("VendedorPrincipal", rol.getNombre());
    }

    @Test
    void noEliminaUnRolDelSistema() {
        Rol rol = rol(2L, "VendedorSecundario");

        assertThrows(IllegalStateException.class, () -> service.delete(2L));
        assertNull(rol.getDeletedAt());
    }

    @Test
    void noEliminaUnRolPropioQueTienenUsuarios() {
        Rol rol = rol(5L, "Promotor");
        when(usuarioRepository.countByRol_Id(5L)).thenReturn(3L);

        IllegalStateException error = assertThrows(IllegalStateException.class, () -> service.delete(5L));

        assertEquals("No se puede eliminar el rol: lo tienen 3 usuarios. Asignales otro rol primero.", error.getMessage());
        assertNull(rol.getDeletedAt());
    }

    @Test
    void eliminaUnRolPropioSinUsuarios() {
        Rol rol = rol(5L, "Promotor");

        service.delete(5L);

        assertNotNull(rol.getDeletedAt());
    }

    private Rol rol(Long id, String nombre) {
        Rol rol = new Rol();
        rol.setId(id);
        rol.setNombre(nombre);
        rol.setActivo(true);
        when(rolRepository.findById(id)).thenReturn(Optional.of(rol));
        return rol;
    }
}
