package com.marketplace.marketplace_backend.modules.tienda;

import com.marketplace.marketplace_backend.common.BaseEntity;
import com.marketplace.marketplace_backend.modules.archivopublicacion.ArchivoPublicacionRepository;
import com.marketplace.marketplace_backend.modules.contacto.ContactoRepository;
import com.marketplace.marketplace_backend.modules.cupon.CuponRepository;
import com.marketplace.marketplace_backend.modules.pedido.EstadoPedido;
import com.marketplace.marketplace_backend.modules.pedido.PedidoRepository;
import com.marketplace.marketplace_backend.modules.producto.ProductoRepository;
import com.marketplace.marketplace_backend.modules.publicacion.Publicacion;
import com.marketplace.marketplace_backend.modules.publicacion.PublicacionRepository;
import com.marketplace.marketplace_backend.modules.rol.Rol;
import com.marketplace.marketplace_backend.modules.rol.RolRepository;
import com.marketplace.marketplace_backend.modules.tienda.dto.TiendaResponseDto;
import com.marketplace.marketplace_backend.modules.tiendausuario.TiendaUsuario;
import com.marketplace.marketplace_backend.modules.tiendausuario.TiendaUsuarioRepository;
import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EstadoTiendaServiceImpl implements EstadoTiendaService {

    private static final String ROL_CLIENTE = "Cliente";
    private static final List<String> ROLES_DE_TIENDA = List.of("VendedorPrincipal", "VendedorSecundario");

    private final TiendaRepository tiendaRepository;
    private final TiendaService tiendaService;
    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final ContactoRepository contactoRepository;
    private final CuponRepository cuponRepository;
    private final PublicacionRepository publicacionRepository;
    private final ArchivoPublicacionRepository archivoPublicacionRepository;
    private final TiendaUsuarioRepository tiendaUsuarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;

    @Override
    @Transactional
    public TiendaResponseDto cambiarActivo(Long idTienda, boolean activo) {
        Tienda tienda = buscar(idTienda);
        // Un pedido pendiente todavia se tiene que confirmar o cancelar: se resuelven
        // antes. Los confirmados y enviados siguen su curso con la tienda desactivada.
        if (!activo) {
            long pendientes = pedidoRepository.countByTienda_IdAndEstado(idTienda, EstadoPedido.PENDIENTE);
            if (pendientes > 0) {
                throw new IllegalStateException("No se puede desactivar la tienda: tiene " + pendientes
                        + (pendientes == 1
                                ? " pedido pendiente. Confirmalo o cancelalo primero."
                                : " pedidos pendientes. Confirmalos o cancelalos primero."));
            }
        }
        tienda.setActivo(activo);
        tiendaRepository.save(tienda);
        return tiendaService.get(idTienda);
    }

    @Override
    @Transactional
    public void eliminar(Long idTienda) {
        Tienda tienda = buscar(idTienda);

        // Los pedidos (tambien los terminados, que son el historial de los clientes) y los
        // productos apuntan a la tienda y dejarian de cargarse.
        long productos = productoRepository.countByTienda_Id(idTienda);
        long pedidos = pedidoRepository.countByTienda_Id(idTienda);
        if (productos + pedidos > 0) {
            List<String> usos = new ArrayList<>();
            if (productos > 0) usos.add(productos + (productos == 1 ? " producto" : " productos"));
            if (pedidos > 0) usos.add(pedidos + (pedidos == 1 ? " pedido" : " pedidos"));
            throw new IllegalStateException("No se puede eliminar la tienda: tiene " + String.join(" y ", usos)
                    + ". Desactivala en lugar de eliminarla.");
        }

        LocalDateTime ahora = LocalDateTime.now();
        darDeBaja(contactoRepository.findAllByTienda_Id(idTienda), ahora);
        darDeBaja(cuponRepository.findAllByTienda_Id(idTienda), ahora);
        List<Publicacion> publicaciones = publicacionRepository.findAllByTienda_Id(idTienda);
        for (Publicacion publicacion : publicaciones) {
            darDeBaja(archivoPublicacionRepository.findByPublicacion_IdOrderByIdAsc(publicacion.getId()), ahora);
        }
        darDeBaja(publicaciones, ahora);

        // El dueño y los colaboradores dejan de tener tienda: vuelven a ser clientes.
        // Si un administrador les habia dado otro rol, se respeta.
        List<TiendaUsuario> equipo = tiendaUsuarioRepository.listarEquipoDeTienda(idTienda);
        for (TiendaUsuario vinculo : equipo) {
            Usuario usuario = vinculo.getUsuario();
            if (ROLES_DE_TIENDA.stream().anyMatch(nombre -> nombre.equalsIgnoreCase(usuario.getRol().getNombre()))) {
                usuario.setRol(rolCliente());
                usuarioRepository.save(usuario);
            }
        }
        darDeBaja(equipo, ahora);

        tienda.setDeletedAt(ahora);
        tiendaRepository.save(tienda);
    }

    private Tienda buscar(Long idTienda) {
        return tiendaRepository.findById(idTienda)
                .orElseThrow(() -> new EntityNotFoundException("Tienda no encontrada"));
    }

    private Rol rolCliente() {
        return rolRepository.findByNombreAndDeletedAtIsNull(ROL_CLIENTE)
                .orElseThrow(() -> new IllegalStateException("Falta el rol " + ROL_CLIENTE));
    }

    // Borrado logico; los cambios se guardan al terminar la transaccion.
    private static void darDeBaja(List<? extends BaseEntity> entidades, LocalDateTime ahora) {
        entidades.forEach(entidad -> entidad.setDeletedAt(ahora));
    }
}
