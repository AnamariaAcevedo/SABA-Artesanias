package com.marketplace.marketplace_backend.modules.pedido;

import com.marketplace.marketplace_backend.modules.mitienda.MiTiendaController;
import com.marketplace.marketplace_backend.modules.mitienda.MiTiendaService;
import com.marketplace.marketplace_backend.modules.pedido.dto.PedidoCreateRequestDto;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.multipart.MultipartFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ComprobantePedidoEndpointsTests {

    private static final String PEDIDO_JSON =
            "{\"idTienda\":1,\"items\":[{\"idProducto\":2,\"cantidad\":3}]}";

    private final PedidoService pedidoService = mock(PedidoService.class);
    private final MiTiendaService miTiendaService = mock(MiTiendaService.class);
    private final MockMvc mvc = MockMvcBuilders
            .standaloneSetup(new PedidoController(pedidoService), new MiTiendaController(miTiendaService))
            .build();

    @Test
    void yaNoSeAceptaUnPedidoEnJsonSinArchivo() throws Exception {
        mvc.perform(post("/pedidos").contentType(MediaType.APPLICATION_JSON).content(PEDIDO_JSON))
                .andExpect(status().isUnsupportedMediaType());

        verifyNoInteractions(pedidoService);
    }

    @Test
    void sinArchivoElControladorDelegaLaValidacionEnElServicio() throws Exception {
        MockMultipartFile pedido = new MockMultipartFile(
                "pedido", "", MediaType.APPLICATION_JSON_VALUE, PEDIDO_JSON.getBytes()
        );

        mvc.perform(multipart("/pedidos").file(pedido)).andExpect(status().isOk());

        verify(pedidoService).crear(any(PedidoCreateRequestDto.class), isNull());
    }

    @Test
    void elPedidoMultipartRecibeLosDatosYElArchivo() throws Exception {
        byte[] contenido = {'%', 'P', 'D', 'F', '-'};
        MockMultipartFile pedido = new MockMultipartFile(
                "pedido", "", MediaType.APPLICATION_JSON_VALUE, PEDIDO_JSON.getBytes()
        );
        MockMultipartFile comprobante = new MockMultipartFile(
                "comprobante", "pago.pdf", MediaType.APPLICATION_PDF_VALUE, contenido
        );

        mvc.perform(multipart("/pedidos").file(pedido).file(comprobante))
                .andExpect(status().isOk());

        ArgumentCaptor<PedidoCreateRequestDto> datos = ArgumentCaptor.forClass(PedidoCreateRequestDto.class);
        ArgumentCaptor<MultipartFile> archivo = ArgumentCaptor.forClass(MultipartFile.class);
        verify(pedidoService).crear(datos.capture(), archivo.capture());
        assertEquals(1L, datos.getValue().getIdTienda());
        assertEquals(3, datos.getValue().getItems().getFirst().getCantidad());
        assertEquals("pago.pdf", archivo.getValue().getOriginalFilename());
    }

    @Test
    void laTiendaRecibeElArchivoConSuTipo() throws Exception {
        byte[] contenido = {'%', 'P', 'D', 'F', '-'};
        ComprobantePedido comprobante = new ComprobantePedido();
        comprobante.setArchivo(contenido);
        comprobante.setContentType(MediaType.APPLICATION_PDF_VALUE);
        when(miTiendaService.obtenerComprobantePedido(5L)).thenReturn(comprobante);

        mvc.perform(get("/mi-tienda/pedidos/5/comprobante"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(content().bytes(contenido));
    }
}
