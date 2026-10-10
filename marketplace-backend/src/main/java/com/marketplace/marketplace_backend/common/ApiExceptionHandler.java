package com.marketplace.marketplace_backend.common;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.ServletRequestBindingException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

import java.io.UncheckedIOException;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

@RestControllerAdvice
// Convierte errores de validación y reglas de negocio al formato estándar de la API.
public class ApiExceptionHandler {

    private static final Logger LOGGER = Logger.getLogger(ApiExceptionHandler.class.getName());

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<StandardResponseDto<Void>> manejarValidacion(MethodArgumentNotValidException exception) {
        List<String> errores = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage() == null ? "Dato inválido" : error.getDefaultMessage())
                .distinct()
                .toList();
        return respuesta(HttpStatus.BAD_REQUEST, errores);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<StandardResponseDto<Void>> manejarRestricciones(ConstraintViolationException exception) {
        List<String> errores = exception.getConstraintViolations().stream()
                .map(error -> error.getMessage())
                .distinct()
                .toList();
        return respuesta(HttpStatus.BAD_REQUEST, errores);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<StandardResponseDto<Void>> manejarDatoInvalido(IllegalArgumentException exception) {
        return respuesta(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<StandardResponseDto<Void>> manejarConflicto(IllegalStateException exception) {
        return respuesta(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<StandardResponseDto<Void>> manejarNoEncontrado(EntityNotFoundException exception) {
        return respuesta(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<StandardResponseDto<Void>> manejarEstadoHttp(ResponseStatusException exception) {
        String mensaje = exception.getReason() == null ? "No pudimos completar la operación" : exception.getReason();
        return respuesta(exception.getStatusCode(), mensaje);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<StandardResponseDto<Void>> manejarJsonInvalido() {
        return respuesta(HttpStatus.BAD_REQUEST, "La solicitud contiene datos inválidos o incompletos");
    }

    @ExceptionHandler({ServletRequestBindingException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<StandardResponseDto<Void>> manejarParametrosInvalidos() {
        return respuesta(HttpStatus.BAD_REQUEST, "La solicitud contiene parámetros inválidos o incompletos");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<StandardResponseDto<Void>> manejarAutenticacion() {
        return respuesta(HttpStatus.UNAUTHORIZED, "Usuario o contraseña incorrectos");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<StandardResponseDto<Void>> manejarPermisoDenegado() {
        return respuesta(HttpStatus.FORBIDDEN, "No tenés permiso para realizar esta acción");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<StandardResponseDto<Void>> manejarMetodoNoPermitido() {
        return respuesta(HttpStatus.METHOD_NOT_ALLOWED, "El método HTTP no está permitido para esta operación");
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<StandardResponseDto<Void>> manejarFormatoNoSoportado() {
        return respuesta(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "El formato enviado no es compatible");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<StandardResponseDto<Void>> manejarArchivoDemasiadoGrande() {
        return respuesta(HttpStatus.PAYLOAD_TOO_LARGE, "El archivo supera el tamaño máximo permitido");
    }

    @ExceptionHandler(UncheckedIOException.class)
    public ResponseEntity<StandardResponseDto<Void>> manejarLecturaDeArchivo(UncheckedIOException exception) {
        LOGGER.log(Level.SEVERE, "No se pudo procesar un archivo", exception);
        return respuesta(HttpStatus.INTERNAL_SERVER_ERROR, "No pudimos procesar el archivo");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<StandardResponseDto<Void>> manejarIntegridad(DataIntegrityViolationException exception) {
        String detalle = exception.getMostSpecificCause().getMessage();
        String detalleNormalizado = detalle == null ? "" : detalle.toLowerCase();
        if (detalleNormalizado.contains("(email)") || detalleNormalizado.contains("email_key")) {
            return respuesta(HttpStatus.CONFLICT, "Ya existe un usuario con ese email");
        }
        if (detalleNormalizado.contains("(usuario)") || detalleNormalizado.contains("usuario_key")) {
            return respuesta(HttpStatus.CONFLICT, "Ya existe un usuario con ese nombre de usuario");
        }
        return respuesta(HttpStatus.CONFLICT, "Ya existe un registro con esos datos");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<StandardResponseDto<Void>> manejarErrorInesperado(Exception exception) {
        LOGGER.log(Level.SEVERE, "Error no controlado en la API", exception);
        return respuesta(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrió un error interno. Intentá nuevamente más tarde");
    }

    private ResponseEntity<StandardResponseDto<Void>> respuesta(HttpStatusCode estado, String error) {
        return respuesta(estado, List.of(error == null || error.isBlank() ? "No pudimos completar la operación" : error));
    }

    private ResponseEntity<StandardResponseDto<Void>> respuesta(HttpStatusCode estado, List<String> errores) {
        StandardResponseDto<Void> cuerpo = new StandardResponseDto<>();
        cuerpo.setSuccess(false);
        cuerpo.setData(null);
        cuerpo.setErrors(errores);
        cuerpo.setPagination(null);
        return ResponseEntity.status(estado).body(cuerpo);
    }
}
