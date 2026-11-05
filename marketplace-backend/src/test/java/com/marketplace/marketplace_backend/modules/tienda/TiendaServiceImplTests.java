package com.marketplace.marketplace_backend.modules.tienda;

import com.marketplace.marketplace_backend.modules.direccion.DireccionRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TiendaServiceImplTests {

    private final TiendaRepository tiendaRepository = mock(TiendaRepository.class);
    private final TiendaServiceImpl service = new TiendaServiceImpl(tiendaRepository, mock(DireccionRepository.class));

    @Test
    void devuelveLosDatosDeCuentaAunqueNoTengaAlias() {
        Tienda tienda = new Tienda();
        tienda.setBanco("Banco");
        tienda.setTitularCuenta("Titular");
        tienda.setDocumentoTitular("1234567");
        tienda.setNroCuenta("000111");
        when(tiendaRepository.findById(1L)).thenReturn(Optional.of(tienda));

        var datos = service.obtenerDatosPago(1L);

        assertEquals("Banco", datos.getBanco());
        assertEquals("000111", datos.getNroCuenta());
        assertNull(datos.getAliasCuenta());
    }

    @Test
    void noDevuelveDatosIncompletos() {
        Tienda tienda = new Tienda();
        tienda.setBanco("Banco");
        when(tiendaRepository.findById(1L)).thenReturn(Optional.of(tienda));

        assertNull(service.obtenerDatosPago(1L));
    }
}
