package com.marketplace.marketplace_backend;

import com.marketplace.marketplace_backend.modules.mitienda.MiTiendaController;
import com.marketplace.marketplace_backend.modules.mitienda.MiTiendaService;
import com.marketplace.marketplace_backend.modules.pedido.PedidoController;
import com.marketplace.marketplace_backend.modules.pedido.PedidoService;
import com.marketplace.marketplace_backend.modules.solicitudvendedor.SolicitudVendedorController;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RequestMapping;

import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class PermisosPorRolTests {

    private static final Pattern PERMISO = Pattern.compile("'([A-Z_]+)'");
    private static final Pattern ACCION_Y_RECURSO = Pattern.compile("\\('(LIST|CREATE|UPDATE|DELETE)', '([A-Z_]+)'\\)");
    // Son de administracion, no de este script: los crea el seeder de cada base.
    private static final Set<String> ADMINISTRACION = Set.of("LIST_PEDIDOS", "LIST_SOLICITUDES_VENDEDOR", "UPDATE_SOLICITUDES_VENDEDOR");

    private static AnnotationConfigApplicationContext context;

    @BeforeAll
    static void iniciar() {
        context = new AnnotationConfigApplicationContext(Config.class);
    }

    @AfterAll
    static void cerrar() {
        context.close();
    }

    @AfterEach
    void limpiarSesion() {
        SecurityContextHolder.clearContext();
    }

    private static List<Method> endpoints(Class<?> controller) {
        return Arrays.stream(controller.getDeclaredMethods())
                .filter(metodo -> AnnotatedElementUtils.hasAnnotation(metodo, RequestMapping.class))
                .toList();
    }

    @Test
    void ningunEndpointDeMiTiendaQuedaSinPermiso() {
        List<String> sinPermiso = endpoints(MiTiendaController.class).stream()
                .filter(metodo -> !metodo.isAnnotationPresent(PreAuthorize.class))
                .map(Method::getName)
                .toList();

        assertEquals(List.of(), sinPermiso);
    }

    @Test
    void elScriptCreaTodosLosPermisosQueExigenLosEndpoints() throws Exception {
        String script = Files.readString(Path.of("scripts/asignar-permisos-por-rol.sql"));
        Set<String> delScript = ACCION_Y_RECURSO.matcher(script).results()
                .map(resultado -> resultado.group(1) + "_" + resultado.group(2))
                .collect(Collectors.toSet());

        Set<String> exigidos = List.of(MiTiendaController.class, PedidoController.class, SolicitudVendedorController.class).stream()
                .flatMap(controller -> endpoints(controller).stream())
                .filter(metodo -> metodo.isAnnotationPresent(PreAuthorize.class))
                .flatMap(metodo -> PERMISO.matcher(metodo.getAnnotation(PreAuthorize.class).value()).results())
                .map(resultado -> resultado.group(1))
                .filter(permiso -> !ADMINISTRACION.contains(permiso))
                .collect(Collectors.toSet());

        assertTrue(delScript.containsAll(exigidos), () -> "Faltan en el script: " + exigidos.stream()
                .filter(permiso -> !delScript.contains(permiso))
                .toList());
    }

    @Test
    void unVendedorSinElPermisoNoPuedeUsarMiTienda() {
        MiTiendaController controller = context.getBean(MiTiendaController.class);

        iniciarSesion("OTRO_PERMISO");
        assertThrows(AccessDeniedException.class, () -> controller.obtenerPedido(1L));

        iniciarSesion("LIST_PEDIDOS_TIENDA");
        assertDoesNotThrow(() -> controller.obtenerPedido(1L));
    }

    @Test
    void losPermisosGlobalesNoAlcanzanParaMiTienda() {
        MiTiendaController controller = context.getBean(MiTiendaController.class);

        iniciarSesion("LIST_PEDIDOS");

        assertThrows(AccessDeniedException.class, () -> controller.obtenerPedido(1L));
    }

    @Test
    void unInvitadoPuedeComprarSinSesion() {
        SecurityContextHolder.getContext().setAuthentication(new AnonymousAuthenticationToken(
                "clave", "anonimo", List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS"))
        ));

        assertDoesNotThrow(() -> context.getBean(PedidoController.class).crear(null, null));
    }

    @Test
    void conSesionComprarDependeDelRol() {
        PedidoController controller = context.getBean(PedidoController.class);

        iniciarSesion("OTRO_PERMISO");
        assertThrows(AccessDeniedException.class, () -> controller.crear(null, null));

        iniciarSesion("CREATE_MIS_COMPRAS");
        assertDoesNotThrow(() -> controller.crear(null, null));
    }

    private static void iniciarSesion(String permiso) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "prueba", "", List.of(new SimpleGrantedAuthority(permiso))
        ));
    }

    @Configuration
    @EnableMethodSecurity
    static class Config {
        @Bean
        MiTiendaController miTiendaController() {
            return new MiTiendaController(mock(MiTiendaService.class));
        }

        @Bean
        PedidoController pedidoController() {
            return new PedidoController(mock(PedidoService.class));
        }
    }
}
