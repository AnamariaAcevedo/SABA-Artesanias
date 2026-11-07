package com.marketplace.marketplace_backend.modules.publicacion;

import com.marketplace.marketplace_backend.modules.archivopublicacion.ArchivoPublicacionRepository;
import com.marketplace.marketplace_backend.modules.archivopublicacion.ArchivoPublicacionServiceImpl;
import com.marketplace.marketplace_backend.modules.cupon.CuponRepository;
import com.marketplace.marketplace_backend.modules.publicacion.dto.PublicacionRequestDto;
import com.marketplace.marketplace_backend.modules.publicacion.dto.PublicacionResponseDto;
import com.marketplace.marketplace_backend.modules.reaccion.ReaccionRepository;
import com.marketplace.marketplace_backend.modules.tienda.Tienda;
import com.marketplace.marketplace_backend.modules.tienda.TiendaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PublicacionServiceImplTests {

    private final PublicacionRepository publicacionRepository = mock(PublicacionRepository.class);
    private final TiendaRepository tiendaRepository = mock(TiendaRepository.class);
    private final ArchivoPublicacionRepository archivoRepository = mock(ArchivoPublicacionRepository.class);

    private final PublicacionServiceImpl service = new PublicacionServiceImpl(
            publicacionRepository,
            tiendaRepository,
            mock(CuponRepository.class),
            mock(ReaccionRepository.class),
            archivoRepository
    );

    @Test
    void alCrearCalculaElVencimientoSegunLaDuracion() {
        when(tiendaRepository.findById(1L)).thenReturn(Optional.of(tienda()));
        when(publicacionRepository.save(any(Publicacion.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        LocalDateTime antes = LocalDateTime.now().plusDays(7);
        PublicacionResponseDto creada = service.crear(1L, pedido(7));
        LocalDateTime despues = LocalDateTime.now().plusDays(7);

        assertFalse(creada.getFechaExpiracion().isBefore(antes));
        assertFalse(creada.getFechaExpiracion().isAfter(despues));
        assertTrue(creada.isVigente());
    }

    @Test
    void noSePuedeCrearSinIndicarLaDuracion() {
        when(tiendaRepository.findById(1L)).thenReturn(Optional.of(tienda()));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.crear(1L, pedido(null))
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verify(publicacionRepository, never()).save(any());
    }

    @Test
    void alEditarSinDuracionMantieneElVencimiento() {
        LocalDateTime vencimiento = LocalDateTime.now().plusDays(3);
        Publicacion publicacion = publicacion(vencimiento);
        when(publicacionRepository.findByIdAndTienda_Id(5L, 1L)).thenReturn(Optional.of(publicacion));
        when(publicacionRepository.save(publicacion)).thenReturn(publicacion);

        PublicacionResponseDto editada = service.actualizar(1L, 5L, pedido(null));

        assertEquals(vencimiento, editada.getFechaExpiracion());
    }

    @Test
    void alEditarConDuracionReactivaUnaPublicacionVencida() {
        Publicacion publicacion = publicacion(LocalDateTime.now().minusDays(1));
        when(publicacionRepository.findByIdAndTienda_Id(5L, 1L)).thenReturn(Optional.of(publicacion));
        when(publicacionRepository.save(publicacion)).thenReturn(publicacion);

        assertTrue(service.actualizar(1L, 5L, pedido(10)).isVigente());
    }

    @Test
    void elCanalPideSoloVigentesDeTodasLasTiendas() {
        when(publicacionRepository.buscarVigentes(any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(publicacion(LocalDateTime.now().plusDays(1)))));

        assertEquals(1, service.findAllPublicas(null, 1, 10).data().size());
    }

    @Test
    void laTiendaMuestraSoloSusVigentes() {
        when(publicacionRepository.buscarVigentesDeTienda(eq(1L), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        assertEquals(0, service.findAllPublicas(1L, 1, 10).data().size());
        verify(publicacionRepository, never()).buscarVigentes(any(), any());
    }

    @Test
    void elVendedorSigueViendoSusPublicacionesVencidas() {
        when(publicacionRepository.findByTienda_IdOrderByIdDesc(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(publicacion(LocalDateTime.now().minusDays(1)))));

        PublicacionResponseDto vencida = service.listarDeTienda(1L, 1, 10).data().getFirst();

        assertFalse(vencida.isVigente());
    }

    @Test
    void unaPublicacionVencidaNoSeVeAlPublico() {
        when(publicacionRepository.findById(5L)).thenReturn(Optional.of(publicacion(LocalDateTime.now().minusMinutes(1))));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.obtenerPublica(5L)
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }

    @Test
    void lasPublicacionesAnterioresSinVencimientoSiguenVigentes() {
        when(publicacionRepository.findById(5L)).thenReturn(Optional.of(publicacion(null)));

        assertTrue(service.obtenerPublica(5L).isVigente());
    }

    @Test
    void laRespuestaIncluyeLasFotosSinCargarSusArchivos() {
        Publicacion publicacion = publicacion(LocalDateTime.now().plusDays(1));
        when(publicacionRepository.findById(5L)).thenReturn(Optional.of(publicacion));
        when(archivoRepository.buscarIdsDePublicacion(5L)).thenReturn(List.of(8L, 9L));

        assertEquals(List.of(8L, 9L), service.obtenerPublica(5L).getIdsArchivos());
        verify(archivoRepository, never()).findByPublicacion_IdOrderByIdAsc(any());
    }

    @Test
    void noSePuedenSubirMasDeDiezFotos() {
        ArchivoPublicacionServiceImpl archivos = new ArchivoPublicacionServiceImpl(archivoRepository, publicacionRepository);
        when(publicacionRepository.findById(5L)).thenReturn(Optional.of(publicacion(null)));
        when(archivoRepository.countByPublicacion_Id(5L)).thenReturn(10L);

        assertThrows(IllegalArgumentException.class, () -> archivos.create(
                5L,
                new MockMultipartFile("archivo", "foto.png", "image/png", new byte[]{1})
        ));

        verify(archivoRepository, never()).save(any());
    }

    private static Tienda tienda() {
        Tienda tienda = new Tienda();
        tienda.setId(1L);
        tienda.setNombre("Tienda");
        return tienda;
    }

    private static Publicacion publicacion(LocalDateTime vencimiento) {
        Publicacion publicacion = new Publicacion();
        publicacion.setId(5L);
        publicacion.setTitulo("Novedad");
        publicacion.setContenido("Texto");
        publicacion.setTienda(tienda());
        publicacion.setFechaExpiracion(vencimiento);
        return publicacion;
    }

    private static PublicacionRequestDto pedido(Integer duracionDias) {
        PublicacionRequestDto pedido = new PublicacionRequestDto();
        pedido.setTitulo(" Novedad ");
        pedido.setContenido(" Texto ");
        pedido.setDuracionDias(duracionDias);
        return pedido;
    }
}
