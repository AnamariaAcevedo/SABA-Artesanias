package com.marketplace.marketplace_backend.modules.mitienda;

import com.marketplace.marketplace_backend.modules.mitienda.dto.MiTiendaUpdateRequestDto;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NroCuentaTests {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void completaConCerosALaIzquierdaHastaNueveDigitos() {
        assertEquals("000012345", MiTiendaServiceImpl.completarNroCuenta("12345"));
        assertEquals("000000007", MiTiendaServiceImpl.completarNroCuenta("7"));
    }

    @Test
    void dejaIgualUnNumeroDeNueveDigitos() {
        assertEquals("123456789", MiTiendaServiceImpl.completarNroCuenta("123456789"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"1", "12345", "123456789", "000000001"})
    void aceptaHastaNueveDigitos(String nroCuenta) {
        assertTrue(erroresDe(nroCuenta).isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "1234567890", "12-345", "abc", " 123"})
    void rechazaLoQueNoSeanHastaNueveDigitos(String nroCuenta) {
        assertFalse(erroresDe(nroCuenta).isEmpty());
    }

    @Test
    void elNumeroDeCuentaEsObligatorio() {
        assertFalse(erroresDe(null).isEmpty());
    }

    private java.util.Set<?> erroresDe(String nroCuenta) {
        return validator.validateValue(MiTiendaUpdateRequestDto.class, "nroCuenta", nroCuenta);
    }
}
