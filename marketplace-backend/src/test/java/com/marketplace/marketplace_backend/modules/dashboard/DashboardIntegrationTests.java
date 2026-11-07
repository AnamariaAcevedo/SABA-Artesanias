package com.marketplace.marketplace_backend.modules.dashboard;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@Transactional(readOnly = true)
class DashboardIntegrationTests {

    @Autowired
    private DashboardService dashboardService;

    @Test
    void consultaElResumenCompletoEnLaBaseDeDatos() {
        var resumen = dashboardService.obtenerResumen(7);

        assertNotNull(resumen);
        assertEquals(7, resumen.ventasDiarias().size());
    }
}
