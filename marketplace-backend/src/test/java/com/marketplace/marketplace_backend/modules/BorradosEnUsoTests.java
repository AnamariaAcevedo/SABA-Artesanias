package com.marketplace.marketplace_backend.modules;

import com.marketplace.marketplace_backend.modules.barrio.Barrio;
import com.marketplace.marketplace_backend.modules.barrio.BarrioRepository;
import com.marketplace.marketplace_backend.modules.barrio.BarrioServiceImpl;
import com.marketplace.marketplace_backend.modules.ciudad.Ciudad;
import com.marketplace.marketplace_backend.modules.ciudad.CiudadRepository;
import com.marketplace.marketplace_backend.modules.ciudad.CiudadServiceImpl;
import com.marketplace.marketplace_backend.modules.contacto.ContactoRepository;
import com.marketplace.marketplace_backend.modules.cupon.Cupon;
import com.marketplace.marketplace_backend.modules.cupon.CuponRepository;
import com.marketplace.marketplace_backend.modules.cupon.CuponServiceImpl;
import com.marketplace.marketplace_backend.modules.departamento.Departamento;
import com.marketplace.marketplace_backend.modules.departamento.DepartamentoRepository;
import com.marketplace.marketplace_backend.modules.departamento.DepartamentoServiceImpl;
import com.marketplace.marketplace_backend.modules.direccion.Direccion;
import com.marketplace.marketplace_backend.modules.direccion.DireccionRepository;
import com.marketplace.marketplace_backend.modules.direccion.DireccionServiceImpl;
import com.marketplace.marketplace_backend.modules.pais.Pais;
import com.marketplace.marketplace_backend.modules.pais.PaisRepository;
import com.marketplace.marketplace_backend.modules.pais.PaisServiceImpl;
import com.marketplace.marketplace_backend.modules.pedido.PedidoRepository;
import com.marketplace.marketplace_backend.modules.permiso.Permiso;
import com.marketplace.marketplace_backend.modules.permiso.PermisoRepository;
import com.marketplace.marketplace_backend.modules.permiso.PermisoServiceImpl;
import com.marketplace.marketplace_backend.modules.publicacion.PublicacionRepository;
import com.marketplace.marketplace_backend.modules.rolpermiso.RolPermiso;
import com.marketplace.marketplace_backend.modules.rolpermiso.RolPermisoRepository;
import com.marketplace.marketplace_backend.modules.solicitudvendedor.SolicitudVendedorRepository;
import com.marketplace.marketplace_backend.modules.tienda.TiendaRepository;
import com.marketplace.marketplace_backend.modules.tipocontacto.TipoContacto;
import com.marketplace.marketplace_backend.modules.tipocontacto.TipoContactoRepository;
import com.marketplace.marketplace_backend.modules.tipocontacto.TipoContactoServiceImpl;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

// Lo que otros registros usan no se elimina: quedarian apuntando a algo borrado y
// dejarian de cargarse. Cada caso arma solo el servicio que prueba.
class BorradosEnUsoTests {

    @Test
    void noEliminaUnPaisConDepartamentos() {
        PaisRepository paises = mock(PaisRepository.class);
        DepartamentoRepository departamentos = mock(DepartamentoRepository.class);
        Pais pais = new Pais();
        when(paises.findById(1L)).thenReturn(Optional.of(pais));
        when(departamentos.countByPais_Id(1L)).thenReturn(2L);

        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> new PaisServiceImpl(paises, departamentos).delete(1L));

        assertEquals("No se puede eliminar el país: tiene 2 departamentos. Eliminalos primero.", error.getMessage());
        assertNull(pais.getDeletedAt());
    }

    @Test
    void noEliminaUnDepartamentoConCiudades() {
        DepartamentoRepository departamentos = mock(DepartamentoRepository.class);
        CiudadRepository ciudades = mock(CiudadRepository.class);
        when(departamentos.findById(2L)).thenReturn(Optional.of(new Departamento()));
        when(ciudades.countByDepartamento_Id(2L)).thenReturn(1L);

        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> new DepartamentoServiceImpl(departamentos, mock(PaisRepository.class), ciudades).delete(2L));

        assertEquals("No se puede eliminar el departamento: tiene 1 ciudad. Eliminala primero.", error.getMessage());
    }

    @Test
    void noEliminaUnaCiudadConBarrios() {
        CiudadRepository ciudades = mock(CiudadRepository.class);
        BarrioRepository barrios = mock(BarrioRepository.class);
        when(ciudades.findById(3L)).thenReturn(Optional.of(new Ciudad()));
        when(barrios.countByCiudad_Id(3L)).thenReturn(1L);

        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> new CiudadServiceImpl(ciudades, mock(DepartamentoRepository.class), barrios).delete(3L));

        assertEquals("No se puede eliminar la ciudad: tiene 1 barrio. Eliminalo primero.", error.getMessage());
    }

    @Test
    void noEliminaUnBarrioEnUsoYDiceQuienLoUsa() {
        BarrioRepository barrios = mock(BarrioRepository.class);
        DireccionRepository direcciones = mock(DireccionRepository.class);
        PedidoRepository pedidos = mock(PedidoRepository.class);
        SolicitudVendedorRepository solicitudes = mock(SolicitudVendedorRepository.class);
        Barrio barrio = new Barrio();
        when(barrios.findById(4L)).thenReturn(Optional.of(barrio));
        when(direcciones.countByBarrio_Id(4L)).thenReturn(4L);
        when(pedidos.countByBarrio_Id(4L)).thenReturn(3L);
        when(solicitudes.countByBarrio_Id(4L)).thenReturn(1L);
        BarrioServiceImpl service = new BarrioServiceImpl(barrios, mock(CiudadRepository.class), direcciones, pedidos, solicitudes);

        IllegalStateException error = assertThrows(IllegalStateException.class, () -> service.delete(4L));

        assertEquals("No se puede eliminar el barrio: lo usan 4 direcciones, 3 pedidos, 1 solicitud de vendedor.",
                error.getMessage());
        assertNull(barrio.getDeletedAt());
    }

    @Test
    void eliminaUnBarrioSinUso() {
        BarrioRepository barrios = mock(BarrioRepository.class);
        Barrio barrio = new Barrio();
        when(barrios.findById(4L)).thenReturn(Optional.of(barrio));
        BarrioServiceImpl service = new BarrioServiceImpl(barrios, mock(CiudadRepository.class),
                mock(DireccionRepository.class), mock(PedidoRepository.class), mock(SolicitudVendedorRepository.class));

        service.delete(4L);

        assertNotNull(barrio.getDeletedAt());
    }

    @Test
    void noEliminaUnaDireccionEnUso() {
        DireccionRepository direcciones = mock(DireccionRepository.class);
        UsuarioRepository usuarios = mock(UsuarioRepository.class);
        TiendaRepository tiendas = mock(TiendaRepository.class);
        when(direcciones.findById(5L)).thenReturn(Optional.of(new Direccion()));
        when(usuarios.countByDireccion_Id(5L)).thenReturn(2L);
        when(tiendas.countByDireccion_Id(5L)).thenReturn(1L);
        DireccionServiceImpl service = new DireccionServiceImpl(direcciones, mock(BarrioRepository.class), usuarios, tiendas);

        IllegalStateException error = assertThrows(IllegalStateException.class, () -> service.delete(5L));

        assertEquals("No se puede eliminar la dirección: la usan 2 usuarios y 1 tienda.", error.getMessage());
    }

    @Test
    void noEliminaElTipoDeContactoWhatsApp() {
        TipoContactoRepository tipos = mock(TipoContactoRepository.class);
        TipoContacto whatsapp = new TipoContacto();
        whatsapp.setNombre("WhatsApp");
        when(tipos.findById(1L)).thenReturn(Optional.of(whatsapp));

        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> new TipoContactoServiceImpl(tipos, mock(ContactoRepository.class)).delete(1L));

        assertEquals("No se puede eliminar el tipo de contacto WhatsApp: se usa al aceptar solicitudes de vendedor.",
                error.getMessage());
    }

    @Test
    void noEliminaUnTipoDeContactoEnUso() {
        TipoContactoRepository tipos = mock(TipoContactoRepository.class);
        ContactoRepository contactos = mock(ContactoRepository.class);
        TipoContacto instagram = new TipoContacto();
        instagram.setNombre("Instagram");
        when(tipos.findById(2L)).thenReturn(Optional.of(instagram));
        when(contactos.countByTipoContacto_Id(2L)).thenReturn(3L);

        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> new TipoContactoServiceImpl(tipos, contactos).delete(2L));

        assertEquals("No se puede eliminar el tipo de contacto: lo usan 3 contactos de tiendas.", error.getMessage());
        assertNull(instagram.getDeletedAt());
    }

    @Test
    void noEliminaUnCuponQueEstaEnUnaPublicacion() {
        CuponRepository cupones = mock(CuponRepository.class);
        PublicacionRepository publicaciones = mock(PublicacionRepository.class);
        Cupon cupon = new Cupon();
        when(cupones.findByIdAndTienda_Id(6L, 1L)).thenReturn(Optional.of(cupon));
        when(publicaciones.countByCupon_Id(6L)).thenReturn(1L);
        CuponServiceImpl service = new CuponServiceImpl(cupones, mock(TiendaRepository.class),
                mock(PedidoRepository.class), mock(UsuarioRepository.class), publicaciones);

        IllegalStateException error = assertThrows(IllegalStateException.class, () -> service.eliminarDeTienda(1L, 6L));

        assertEquals("No se puede eliminar el cupón: está en 1 publicación. Quitalo de ahí primero.", error.getMessage());
        assertNull(cupon.getDeletedAt());
    }

    @Test
    void alEliminarUnPermisoSeQuitaDeLosRoles() {
        PermisoRepository permisos = mock(PermisoRepository.class);
        RolPermisoRepository asignaciones = mock(RolPermisoRepository.class);
        Permiso permiso = new Permiso();
        RolPermiso asignacion = new RolPermiso();
        when(permisos.findById(8L)).thenReturn(Optional.of(permiso));
        when(asignaciones.findByPermiso_Id(8L)).thenReturn(List.of(asignacion));

        new PermisoServiceImpl(permisos, asignaciones).delete(8L);

        assertNotNull(permiso.getDeletedAt());
        assertNotNull(asignacion.getDeletedAt());
    }
}
