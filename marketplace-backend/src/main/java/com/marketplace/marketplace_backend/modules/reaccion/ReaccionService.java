package com.marketplace.marketplace_backend.modules.reaccion;

// Gestion de reacciones de usuarios a publicaciones. Ambas operaciones actuan sobre
// el usuario autenticado y devuelven la cantidad total de reacciones de la publicacion.
public interface ReaccionService {
    long crear(Long idPublicacion);

    long quitar(Long idPublicacion);
}
