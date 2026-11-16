package com.marketplace.marketplace_backend.modules.tiendausuario;

import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

// Acceso a datos de TiendaUsuario: busqueda del vinculo de un usuario con su tienda
public interface TiendaUsuarioRepository extends JpaRepository<TiendaUsuario, Long> {

    Optional<TiendaUsuario> findFirstByUsuario_Id(Long idUsuario);

    boolean existsByUsuario_Id(Long idUsuario);

    // Equipo de una tienda: primero el dueño (PRINCIPAL) y despues los colaboradores,
    // del mas antiguo al mas nuevo.
    @Query("""
            SELECT vinculo FROM TiendaUsuario vinculo
            JOIN FETCH vinculo.usuario
            WHERE vinculo.tienda.id = :idTienda
            ORDER BY vinculo.tipo ASC, vinculo.id ASC
            """)
    List<TiendaUsuario> listarEquipoDeTienda(@Param("idTienda") Long idTienda);

    Optional<TiendaUsuario> findByIdAndTienda_Id(Long id, Long idTienda);

    // Sugerencias del buscador de colaboradores: usuarios cuyo nombre de usuario empieza
    // con `prefijo` (en minusculas y con los comodines de LIKE ya escapados), salvo quien
    // busca. Se incluyen tambien los que no se pueden agregar, para avisar el motivo.
    @Query("""
            SELECT usuario FROM Usuario usuario
            JOIN FETCH usuario.rol
            WHERE LOWER(usuario.usuario) LIKE CONCAT(:prefijo, '%') ESCAPE '\\'
              AND usuario.id <> :idExcluido
            ORDER BY usuario.usuario ASC
            """)
    List<Usuario> buscarPorPrefijoDeUsuario(
            @Param("prefijo") String prefijo,
            @Param("idExcluido") Long idExcluido,
            Pageable pageable);
}
