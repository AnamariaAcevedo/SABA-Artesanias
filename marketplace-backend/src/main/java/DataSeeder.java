package com.marketplace.marketplace_backend;

import com.marketplace.marketplace_backend.modules.barrio.Barrio;
import com.marketplace.marketplace_backend.modules.barrio.BarrioRepository;
import com.marketplace.marketplace_backend.modules.ciudad.Ciudad;
import com.marketplace.marketplace_backend.modules.ciudad.CiudadRepository;
import com.marketplace.marketplace_backend.modules.departamento.Departamento;
import com.marketplace.marketplace_backend.modules.departamento.DepartamentoRepository;
import com.marketplace.marketplace_backend.modules.direccion.Direccion;
import com.marketplace.marketplace_backend.modules.direccion.DireccionRepository;
import com.marketplace.marketplace_backend.modules.pais.Pais;
import com.marketplace.marketplace_backend.modules.pais.PaisRepository;
import com.marketplace.marketplace_backend.modules.permiso.Permiso;
import com.marketplace.marketplace_backend.modules.permiso.PermisoRepository;
import com.marketplace.marketplace_backend.modules.producto.Producto;
import com.marketplace.marketplace_backend.modules.producto.ProductoRepository;
import com.marketplace.marketplace_backend.modules.rol.Rol;
import com.marketplace.marketplace_backend.modules.rol.RolRepository;
import com.marketplace.marketplace_backend.modules.rolpermiso.RolPermiso;
import com.marketplace.marketplace_backend.modules.rolpermiso.RolPermisoRepository;
import com.marketplace.marketplace_backend.modules.tienda.Tienda;
import com.marketplace.marketplace_backend.modules.tienda.TiendaRepository;
import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import lombok.AllArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@AllArgsConstructor
// Carga datos iniciales al arrancar la app. Es algo temporal, solo para probar
// el backend mientras el frontend todavía no está implementado.
public class DataSeeder implements CommandLineRunner {

    private static final String ROL_ADMINISTRADOR = "Administrador";
    private static final String ROL_VENDEDOR_PRINCIPAL = "VendedorPrincipal";
    private static final String ROL_VENDEDOR_SECUNDARIO = "VendedorSecundario";
    private static final String ROL_CLIENTE = "Cliente";

    private final RolRepository rolRepository;
    private final PermisoRepository permisoRepository;
    private final RolPermisoRepository rolPermisoRepository;
    private final UsuarioRepository usuarioRepository;
    private final PaisRepository paisRepository;
    private final DepartamentoRepository departamentoRepository;
    private final CiudadRepository ciudadRepository;
    private final BarrioRepository barrioRepository;
    private final DireccionRepository direccionRepository;
    private final TiendaRepository tiendaRepository;
    private final ProductoRepository productoRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedRoles();
        seedPermisos();
        seedPermisosAdministrador();
        seedUbicaciones();
        seedUsuarios();
        seedTiendas();
        seedProductos();
    }

    private void seedRoles() {
        if (rolRepository.count() > 0) {
            return;
        }

        List<String> rolesIniciales = List.of(
                ROL_VENDEDOR_PRINCIPAL,
                ROL_VENDEDOR_SECUNDARIO,
                ROL_CLIENTE,
                ROL_ADMINISTRADOR
        );

        for (String nombre : rolesIniciales) {
            Rol rol = new Rol();
            rol.setNombre(nombre);
            rol.setActivo(true);
            rolRepository.save(rol);
        }
    }

    private void seedPermisos() {
        if (permisoRepository.count() > 0) {
            return;
        }

        // Recursos con CRUD completo + endpoint /options (dropdowns)
        List<String> recursosConOptions = List.of("ROLES", "PERMISOS", "USUARIOS");
        // Recursos con CRUD completo, sin /options
        List<String> recursosCrudCompleto = List.of("DIRECCIONES");
        // Recursos donde GET/LIST son públicos (sin @PreAuthorize): solo hacen
        // falta permisos para las acciones que sí siguen protegidas.
        List<String> recursosSoloEscritura = List.of(
                "PAISES", "DEPARTAMENTOS", "CIUDADES", "BARRIOS", "TIENDAS", "PRODUCTOS"
        );
        List<String> accionesBase = List.of("CREATE", "UPDATE", "GET", "LIST", "DELETE");
        List<String> accionesEscritura = List.of("CREATE", "UPDATE", "DELETE");

        for (String resource : recursosConOptions) {
            for (String action : accionesBase) {
                guardarPermiso(action, resource);
            }
            guardarPermiso("OPTIONS", resource);
        }

        for (String resource : recursosCrudCompleto) {
            for (String action : accionesBase) {
                guardarPermiso(action, resource);
            }
        }

        for (String resource : recursosSoloEscritura) {
            for (String action : accionesEscritura) {
                guardarPermiso(action, resource);
            }
        }

        guardarPermiso("ASSIGN", "PERMISOS");
        guardarPermiso("REVOKE", "PERMISOS");
    }

    private void guardarPermiso(String action, String resource) {
        Permiso permiso = new Permiso();
        permiso.setAction(action);
        permiso.setResource(resource);
        permisoRepository.save(permiso);
    }

    private void seedPermisosAdministrador() {
        Rol rolAdministrador = rolRepository.findByNombreAndDeletedAtIsNull(ROL_ADMINISTRADOR)
                .orElseThrow(() -> new IllegalStateException("Rol no encontrado: " + ROL_ADMINISTRADOR));

        if (rolPermisoRepository.existsByRol_Id(rolAdministrador.getId())) {
            return;
        }

        List<Permiso> todosLosPermisos = permisoRepository.findAll();
        for (Permiso permiso : todosLosPermisos) {
            rolPermisoRepository.save(new RolPermiso(rolAdministrador, permiso));
        }
    }

    private void seedUbicaciones() {
        if (direccionRepository.count() > 0) {
            return;
        }

        Pais paraguay = crearPais("Paraguay");
        Pais argentina = crearPais("Argentina");

        Departamento central = crearDepartamento("Central", paraguay);
        Departamento altoParana = crearDepartamento("Alto Paraná", paraguay);
        Departamento buenosAires = crearDepartamento("Buenos Aires", argentina);

        Ciudad asuncion = crearCiudad("Asunción", central);
        Ciudad lambare = crearCiudad("Lambaré", central);
        Ciudad ciudadDelEste = crearCiudad("Ciudad del Este", altoParana);
        Ciudad laPlata = crearCiudad("La Plata", buenosAires);

        Barrio centroAsuncion = crearBarrio("Centro", asuncion);
        Barrio recoleta = crearBarrio("Recoleta", asuncion);
        Barrio sanIsidro = crearBarrio("San Isidro", lambare);
        Barrio km7 = crearBarrio("Km 7", ciudadDelEste);
        crearBarrio("Centro", laPlata);

        crearDireccion("Casa Central", null, 123, null, centroAsuncion);
        crearDireccion("Av. Mariscal López", null, 1234, null, recoleta);
        crearDireccion("Av. Monseñor Rodríguez", "Shopping China", null, "Local 12", km7);
        crearDireccion("Calle San Isidro", null, 456, null, sanIsidro);
    }

    private Pais crearPais(String nombre) {
        Pais pais = new Pais();
        pais.setNombre(nombre);
        return paisRepository.save(pais);
    }

    private Departamento crearDepartamento(String nombre, Pais pais) {
        Departamento departamento = new Departamento();
        departamento.setNombre(nombre);
        departamento.setPais(pais);
        return departamentoRepository.save(departamento);
    }

    private Ciudad crearCiudad(String nombre, Departamento departamento) {
        Ciudad ciudad = new Ciudad();
        ciudad.setNombre(nombre);
        ciudad.setDepartamento(departamento);
        return ciudadRepository.save(ciudad);
    }

    private Barrio crearBarrio(String nombre, Ciudad ciudad) {
        Barrio barrio = new Barrio();
        barrio.setNombre(nombre);
        barrio.setCiudad(ciudad);
        return barrioRepository.save(barrio);
    }

    private Direccion crearDireccion(
            String calle,
            String nombreEdificio,
            Integer nroCasa,
            String nroDepartamento,
            Barrio barrio
    ) {
        Direccion direccion = new Direccion();
        direccion.setCalle(calle);
        direccion.setNombreEdificio(nombreEdificio);
        direccion.setNroCasa(nroCasa);
        direccion.setNroDepartamento(nroDepartamento);
        direccion.setBarrio(barrio);
        return direccionRepository.save(direccion);
    }

    private Direccion buscarDireccionPorCalle(String calle) {
        return direccionRepository.findByCalleContainingIgnoreCase(calle, PageRequest.of(0, 1))
                .getContent().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("No se encontró la dirección: " + calle));
    }

    private void seedUsuarios() {
        if (usuarioRepository.count() > 0) {
            return;
        }

        Rol rolAdministrador = rolRepository.findByNombreAndDeletedAtIsNull(ROL_ADMINISTRADOR)
                .orElseThrow(() -> new IllegalStateException("Rol no encontrado: " + ROL_ADMINISTRADOR));

        Direccion direccion = buscarDireccionPorCalle("Casa Central");

        Usuario usuario = new Usuario();
        usuario.setNombre(ROL_ADMINISTRADOR);
        usuario.setApellido("Prueba");
        usuario.setContrasenha(passwordEncoder.encode("SABA123"));
        usuario.setEmail("administrador@saba.com");
        usuario.setUsuario("administrador");
        usuario.setRol(rolAdministrador);
        usuario.setDireccion(direccion);
        usuario.setActivo(true);
        usuarioRepository.save(usuario);
    }

    private void seedTiendas() {
        if (tiendaRepository.count() > 0) {
            return;
        }

        crearTienda("Artesanías Ñandutí", "Encajes y tejidos artesanales paraguayos", "Av. Mariscal López");
        crearTienda("Cerámica Itá", "Cerámica artesanal pintada a mano", "Av. Monseñor Rodríguez");
        crearTienda("Cueros del Sur", "Productos de cuero genuino hechos a mano", "Calle San Isidro");
    }

    private void crearTienda(String nombre, String descripcion, String calleDireccion) {
        Tienda tienda = new Tienda();
        tienda.setNombre(nombre);
        tienda.setDescripcion(descripcion);
        tienda.setDireccion(buscarDireccionPorCalle(calleDireccion));
        tiendaRepository.save(tienda);
    }

    private void seedProductos() {
        if (productoRepository.count() > 0) {
            return;
        }

        Tienda nandutí = buscarTiendaPorNombre("Artesanías Ñandutí");
        Tienda ceramica = buscarTiendaPorNombre("Cerámica Itá");
        Tienda cueros = buscarTiendaPorNombre("Cueros del Sur");

        crearProducto("Mantel de Ñandutí", "Mantel tejido a mano, 2x1.5m", 150000.0, 4.8, 10.0, 10, nandutí);
        crearProducto("Blusa bordada en ñandutí", "Blusa de algodón con bordado artesanal", 95000.0, 4.5, null, 15, nandutí);

        crearProducto("Jarrón de cerámica pintado", "Jarrón decorativo hecho a mano", 60000.0, 4.6, null, 20, ceramica);
        crearProducto("Plato decorativo de barro", "Plato tradicional pintado a mano", 35000.0, null, 5.0, 25, ceramica);

        crearProducto("Cinturón de cuero repujado", "Cinturón artesanal de cuero genuino", 80000.0, 4.7, null, 30, cueros);
        crearProducto("Billetera de cuero", "Billetera artesanal con compartimentos", 45000.0, 4.9, 15.0, 40, cueros);
    }

    private Tienda buscarTiendaPorNombre(String nombre) {
        return tiendaRepository.findByNombreContainingIgnoreCase(nombre, PageRequest.of(0, 1))
                .getContent().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("No se encontró la tienda: " + nombre));
    }

    private void crearProducto(
            String nombre,
            String descripcion,
            Double precio,
            Double puntuacion,
            Double descuento,
            Integer cantidadDisponible,
            Tienda tienda
    ) {
        Producto producto = new Producto();
        producto.setNombre(nombre);
        producto.setDescripcion(descripcion);
        producto.setPrecio(precio);
        producto.setPuntuacion(puntuacion);
        producto.setDescuento(descuento);
        producto.setCantidadDisponible(cantidadDisponible);
        producto.setTienda(tienda);
        productoRepository.save(producto);
    }
}