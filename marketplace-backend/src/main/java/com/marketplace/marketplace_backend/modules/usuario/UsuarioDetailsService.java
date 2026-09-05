package com.marketplace.marketplace_backend.modules.usuario;

import com.marketplace.marketplace_backend.modules.rolpermiso.RolPermisoRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
// Implementa UserDetailsService: carga usuario, rol y permisos para armar las authorities de Spring Security
public class UsuarioDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;
    private final RolPermisoRepository rolPermisoRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String usuario) throws UsernameNotFoundException {
        Usuario usuarioEntity = usuarioRepository.findByUsuarioIgnoreCase(usuario)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + usuario));

        if (Boolean.FALSE.equals(usuarioEntity.getActivo())) {
            throw new UsernameNotFoundException("Usuario inactivo: " + usuario);
        }

        var authorities = new ArrayList<SimpleGrantedAuthority>();

        var rol = usuarioEntity.getRol();
        if (rol != null && Boolean.TRUE.equals(rol.getActivo())) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + rol.getNombre()));

            List<SimpleGrantedAuthority> permisoAuthorities = rolPermisoRepository.findByRol_Id(rol.getId()).stream()
                    .map(rp -> rp.getPermiso())
                    .filter(p -> p != null)
                    .map(p -> new SimpleGrantedAuthority(p.getAction() + "_" + p.getResource()))
                    .distinct()
                    .toList();

            authorities.addAll(permisoAuthorities);
        }

        return User.builder()
                .username(usuarioEntity.getUsuario())
                .password(usuarioEntity.getContrasenha())
                .authorities(authorities)
                .build();
    }
}
