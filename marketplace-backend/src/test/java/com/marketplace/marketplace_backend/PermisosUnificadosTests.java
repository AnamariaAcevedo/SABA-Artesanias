package com.marketplace.marketplace_backend;

import com.marketplace.marketplace_backend.modules.pais.*;
import com.marketplace.marketplace_backend.modules.departamento.*;
import com.marketplace.marketplace_backend.modules.ciudad.*;
import com.marketplace.marketplace_backend.modules.barrio.*;
import com.marketplace.marketplace_backend.modules.direccion.*;
import com.marketplace.marketplace_backend.modules.categoria.*;
import com.marketplace.marketplace_backend.modules.subcategoria.*;
import com.marketplace.marketplace_backend.modules.solicitudvendedor.*;
import com.marketplace.marketplace_backend.modules.solicitudvendedor.dto.RechazarSolicitudRequestDto;
import com.marketplace.marketplace_backend.common.PagedResult;
import org.junit.jupiter.api.*;
import com.marketplace.marketplace_backend.modules.usuario.*;
import com.marketplace.marketplace_backend.modules.rol.*;
import com.marketplace.marketplace_backend.modules.permiso.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
import java.lang.reflect.*;
import java.util.*;
import java.util.stream.Stream;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PermisosUnificadosTests {
    static AnnotationConfigApplicationContext context;
    @BeforeAll static void start() { context = new AnnotationConfigApplicationContext(Config.class); }
    @AfterAll static void stop() { context.close(); }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    static Stream<Arguments> endpoints() {
        return Stream.of(
            Arguments.of(UsuarioController.class, "get", "LIST_USUARIOS"),
            Arguments.of(UsuarioController.class, "findAll", "LIST_USUARIOS"),
            Arguments.of(RolController.class, "get", "LIST_ROLES"),
            Arguments.of(RolController.class, "findAll", "LIST_ROLES"),
            Arguments.of(PermisoController.class, "get", "LIST_PERMISOS"),
            Arguments.of(PermisoController.class, "findAll", "LIST_PERMISOS"),
            Arguments.of(PaisController.class, "create", "CREATE_DIRECCIONES"),
            Arguments.of(PaisController.class, "update", "UPDATE_DIRECCIONES"),
            Arguments.of(PaisController.class, "delete", "DELETE_DIRECCIONES"),
            Arguments.of(PaisController.class, "get", "LIST_DIRECCIONES"),
            Arguments.of(PaisController.class, "findAll", "LIST_DIRECCIONES"),
            Arguments.of(DepartamentoController.class, "create", "CREATE_DIRECCIONES"),
            Arguments.of(DepartamentoController.class, "update", "UPDATE_DIRECCIONES"),
            Arguments.of(DepartamentoController.class, "delete", "DELETE_DIRECCIONES"),
            Arguments.of(DepartamentoController.class, "get", "LIST_DIRECCIONES"),
            Arguments.of(DepartamentoController.class, "findAll", "LIST_DIRECCIONES"),
            Arguments.of(CiudadController.class, "create", "CREATE_DIRECCIONES"),
            Arguments.of(CiudadController.class, "update", "UPDATE_DIRECCIONES"),
            Arguments.of(CiudadController.class, "delete", "DELETE_DIRECCIONES"),
            Arguments.of(CiudadController.class, "get", "LIST_DIRECCIONES"),
            Arguments.of(CiudadController.class, "findAll", "LIST_DIRECCIONES"),
            Arguments.of(BarrioController.class, "create", "CREATE_DIRECCIONES"),
            Arguments.of(BarrioController.class, "update", "UPDATE_DIRECCIONES"),
            Arguments.of(BarrioController.class, "delete", "DELETE_DIRECCIONES"),
            Arguments.of(BarrioController.class, "get", "LIST_DIRECCIONES"),
            Arguments.of(BarrioController.class, "findAll", "LIST_DIRECCIONES"),
            Arguments.of(DireccionController.class, "create", "CREATE_DIRECCIONES"),
            Arguments.of(DireccionController.class, "update", "UPDATE_DIRECCIONES"),
            Arguments.of(DireccionController.class, "delete", "DELETE_DIRECCIONES"),
            Arguments.of(DireccionController.class, "get", "LIST_DIRECCIONES"),
            Arguments.of(DireccionController.class, "findAll", "LIST_DIRECCIONES"),
            Arguments.of(CategoriaController.class, "create", "CREATE_CATEGORIAS"),
            Arguments.of(CategoriaController.class, "update", "UPDATE_CATEGORIAS"),
            Arguments.of(CategoriaController.class, "delete", "DELETE_CATEGORIAS"),
            Arguments.of(SubcategoriaController.class, "create", "CREATE_CATEGORIAS"),
            Arguments.of(SubcategoriaController.class, "update", "UPDATE_CATEGORIAS"),
            Arguments.of(SubcategoriaController.class, "delete", "DELETE_CATEGORIAS"),
            Arguments.of(SolicitudVendedorController.class, "aceptar", "UPDATE_SOLICITUDES_VENDEDOR"),
            Arguments.of(SolicitudVendedorController.class, "rechazar", "UPDATE_SOLICITUDES_VENDEDOR"));
    }
    @ParameterizedTest @MethodSource("endpoints")
    void exigePermisoUnificado(Class<?> controller, String method, String authority) throws Exception {
        var target = context.getBean(controller);
        var endpoint = Arrays.stream(controller.getMethods()).filter(m -> m.getName().equals(method)).findFirst().orElseThrow();
        var args = Arrays.stream(endpoint.getParameterTypes()).map(t -> {
            if (t == Long.class) return 1L;
            if (t == RechazarSolicitudRequestDto.class) return new RechazarSolicitudRequestDto("Motivo de prueba");
            return null;
        }).toArray();
        login("SIN_PERMISO");
        var denied = assertThrows(InvocationTargetException.class, () -> endpoint.invoke(target, args));
        assertInstanceOf(AccessDeniedException.class, denied.getCause());
        login(authority);
        assertDoesNotThrow(() -> endpoint.invoke(target, args));
    }
    static void login(String authority) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
            "prueba", "", List.of(new SimpleGrantedAuthority(authority))));
    }
    static <T> T service(Class<T> type) {
        return mock(type, invocation -> invocation.getMethod().getName().equals("findAll")
            ? new PagedResult<>(List.of(), 1, 10, 0) : RETURNS_DEFAULTS.answer(invocation));
    }
    @Configuration @EnableMethodSecurity
    static class Config {
        @Bean UsuarioService usuarioService() { return service(UsuarioService.class); }
        @Bean UsuarioController usuarioController(UsuarioService service) { return new UsuarioController(service); }
        @Bean RolService rolService() { return service(RolService.class); }
        @Bean RolController rolController(RolService service) { return new RolController(service); }
        @Bean PermisoService permisoService() { return service(PermisoService.class); }
        @Bean PermisoController permisoController(PermisoService service) { return new PermisoController(service); }
        @Bean PaisService paisService() { return service(PaisService.class); }
        @Bean PaisController paisController(PaisService service) { return new PaisController(service); }
        @Bean DepartamentoService departamentoService() { return service(DepartamentoService.class); }
        @Bean DepartamentoController departamentoController(DepartamentoService service) { return new DepartamentoController(service); }
        @Bean CiudadService ciudadService() { return service(CiudadService.class); }
        @Bean CiudadController ciudadController(CiudadService service) { return new CiudadController(service); }
        @Bean BarrioService barrioService() { return service(BarrioService.class); }
        @Bean BarrioController barrioController(BarrioService service) { return new BarrioController(service); }
        @Bean DireccionService direccionService() { return service(DireccionService.class); }
        @Bean DireccionController direccionController(DireccionService service) { return new DireccionController(service); }
        @Bean CategoriaService categoriaService() { return service(CategoriaService.class); }
        @Bean CategoriaController categoriaController(CategoriaService service) { return new CategoriaController(service); }
        @Bean SubcategoriaService subcategoriaService() { return service(SubcategoriaService.class); }
        @Bean SubcategoriaController subcategoriaController(SubcategoriaService service) { return new SubcategoriaController(service); }
        @Bean SolicitudVendedorService solicitudVendedorService() { return service(SolicitudVendedorService.class); }
        @Bean SolicitudVendedorController solicitudVendedorController(SolicitudVendedorService service) { return new SolicitudVendedorController(service); }
    }
}
