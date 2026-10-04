package com.marketplace.marketplace_backend.modules.recuperacion;

// Operaciones de negocio para recuperar la contraseña por correo
public interface RecuperacionService {
    void solicitar(String email);

    void confirmar(String token, String contrasenhaNueva);
}
