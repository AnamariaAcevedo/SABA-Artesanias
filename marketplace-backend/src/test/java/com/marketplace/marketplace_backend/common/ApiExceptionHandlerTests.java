package com.marketplace.marketplace_backend.common;

import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;

class ApiExceptionHandlerTests {

    private final ApiExceptionHandler handler = new ApiExceptionHandler();

    @Test
    void informaElMotivoCuandoHayUnConflictoDeDatos() {
        var response = handler.manejarConflicto(
                new IllegalStateException("Ya existe un usuario con ese email")
        );

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Ya existe un usuario con ese email", response.getBody().getErrors().getFirst());
    }

    @Test
    void devuelveLosMensajesDeValidacionDelFormulario() {
        var bindingResult = new BeanPropertyBindingResult(new Object(), "request");
        bindingResult.addError(new FieldError("request", "email", "El email no tiene un formato válido"));
        var exception = new MethodArgumentNotValidException(mock(MethodParameter.class), bindingResult);

        var response = handler.manejarValidacion(exception);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("El email no tiene un formato válido", response.getBody().getErrors().getFirst());
    }

    @Test
    void noExponeDetallesAlFallarLaAutenticacion() {
        var response = handler.manejarAutenticacion();

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Usuario o contraseña incorrectos", response.getBody().getErrors().getFirst());
    }

    @Test
    void ocultaLosDetallesDeErroresInternos() {
        var response = handler.manejarErrorInesperado(new RuntimeException("dato interno sensible"));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Ocurrió un error interno. Intentá nuevamente más tarde", response.getBody().getErrors().getFirst());
    }
}
