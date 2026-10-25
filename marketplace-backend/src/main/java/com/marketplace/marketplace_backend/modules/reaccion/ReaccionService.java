package com.marketplace.marketplace_backend.modules.reaccion;

// Gestion de reacciones de usuarios a publicaciones
public interface ReaccionService {
    // Registra una reaccion del usuario autenticado a la publicacion y devuelve
    // la cantidad total de reacciones de esa publicacion.
    long crear(Long idPublicacion);
}
