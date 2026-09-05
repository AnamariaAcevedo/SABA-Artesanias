package com.marketplace.marketplace_backend;

import com.marketplace.marketplace_backend.modules.rol.Rol;
import com.marketplace.marketplace_backend.modules.rol.RolRepository;
import lombok.AllArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@AllArgsConstructor
// Carga datos iniciales al arrancar la app. Es algo temporal, solo para probar
// el backend mientras el frontend todavía no está implementado.
public class DataSeeder implements CommandLineRunner {

    private final RolRepository rolRepository;

    @Override
    public void run(String... args) {
        if (rolRepository.count() > 0) {
            return;
        }

        List<String> rolesIniciales = List.of(
                "Vendedor principal",
                "Vendedor secundario",
                "Cliente",
                "Administrador"
        );

        for (String nombre : rolesIniciales) {
            Rol rol = new Rol();
            rol.setNombre(nombre);
            rol.setActivo(true);
            rolRepository.save(rol);
        }
    }
}
