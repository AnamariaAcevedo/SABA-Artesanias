package com.marketplace.marketplace_backend.modules.mitienda;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.contacto.dto.ContactoResponseDto;
import com.marketplace.marketplace_backend.modules.imagenproducto.dto.ImagenProductoResponseDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiContactoRequestDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiProductoRequestDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiTiendaResponseDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiTiendaUpdateRequestDto;
import com.marketplace.marketplace_backend.modules.cupon.dto.CuponRequestDto;
import com.marketplace.marketplace_backend.modules.cupon.dto.CuponResponseDto;
import com.marketplace.marketplace_backend.modules.archivopublicacion.dto.ArchivoPublicacionResponseDto;
import com.marketplace.marketplace_backend.modules.pedido.ComprobantePedido;
import com.marketplace.marketplace_backend.modules.pedido.dto.PedidoResponseDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoResponseDto;
import com.marketplace.marketplace_backend.modules.publicacion.dto.PublicacionRequestDto;
import com.marketplace.marketplace_backend.modules.publicacion.dto.PublicacionResponseDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/mi-tienda")
@RestController
// Endpoints REST para que un vendedor gestione su propia tienda. El permiso del rol
// define que puede hacer y el vinculo del usuario con la tienda (tienda_usuario), que
// se verifica en el service en cada operacion, define sobre cual tienda.
public class MiTiendaController {

    private final MiTiendaService miTiendaService;

    @GetMapping
    @PreAuthorize("hasAuthority('LIST_MI_TIENDA')")
    public ResponseEntity<StandardResponseDto<MiTiendaResponseDto>> obtenerTienda() {
        return ok(miTiendaService.obtenerTienda());
    }

    @PutMapping
    @PreAuthorize("hasAuthority('UPDATE_MI_TIENDA')")
    public ResponseEntity<StandardResponseDto<MiTiendaResponseDto>> actualizarTienda(@Valid @RequestBody MiTiendaUpdateRequestDto request) {
        return ok(miTiendaService.actualizarTienda(request));
    }

    @GetMapping("/productos")
    @PreAuthorize("hasAuthority('LIST_MIS_PRODUCTOS')")
    public ResponseEntity<StandardResponseDto<List<ProductoResponseDto>>> listarProductos(
            @RequestParam(required = false) String nombre,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int perPage) {
        StandardResponseDto<List<ProductoResponseDto>> response = new StandardResponseDto<>();
        var result = miTiendaService.listarProductos(nombre, page, perPage);
        response.setSuccess(true);
        response.setData(result.data());
        response.setErrors(null);
        response.setPagination(new Pagination(result.page(), result.perPage(), result.total()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/productos/{id}")
    @PreAuthorize("hasAuthority('LIST_MIS_PRODUCTOS')")
    public ResponseEntity<StandardResponseDto<ProductoResponseDto>> obtenerProducto(@PathVariable Long id) {
        return ok(miTiendaService.obtenerProducto(id));
    }

    @PostMapping("/productos")
    @PreAuthorize("hasAuthority('CREATE_MIS_PRODUCTOS')")
    public ResponseEntity<StandardResponseDto<ProductoResponseDto>> crearProducto(@Valid @RequestBody MiProductoRequestDto request) {
        return ok(miTiendaService.crearProducto(request));
    }

    @PutMapping("/productos/{id}")
    @PreAuthorize("hasAuthority('UPDATE_MIS_PRODUCTOS')")
    public ResponseEntity<StandardResponseDto<ProductoResponseDto>> actualizarProducto(@PathVariable Long id, @Valid @RequestBody MiProductoRequestDto request) {
        return ok(miTiendaService.actualizarProducto(id, request));
    }

    @DeleteMapping("/productos/{id}")
    @PreAuthorize("hasAuthority('DELETE_MIS_PRODUCTOS')")
    public ResponseEntity<StandardResponseDto<Void>> eliminarProducto(@PathVariable Long id) {
        miTiendaService.eliminarProducto(id);
        return ok(null);
    }

    @GetMapping("/productos/{id}/imagenes")
    @PreAuthorize("hasAuthority('LIST_MIS_PRODUCTOS')")
    public ResponseEntity<StandardResponseDto<List<ImagenProductoResponseDto>>> listarImagenes(@PathVariable Long id) {
        return ok(miTiendaService.listarImagenes(id));
    }

    @PostMapping(value = "/productos/{id}/imagenes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyAuthority('CREATE_MIS_PRODUCTOS', 'UPDATE_MIS_PRODUCTOS')")
    public ResponseEntity<StandardResponseDto<ImagenProductoResponseDto>> subirImagen(
            @PathVariable Long id,
            @RequestParam("archivo") MultipartFile archivo) {
        return ok(miTiendaService.subirImagen(id, archivo));
    }

    @DeleteMapping("/productos/{id}/imagenes/{idImagen}")
    @PreAuthorize("hasAuthority('UPDATE_MIS_PRODUCTOS')")
    public ResponseEntity<StandardResponseDto<Void>> eliminarImagen(@PathVariable Long id, @PathVariable Long idImagen) {
        miTiendaService.eliminarImagen(id, idImagen);
        return ok(null);
    }

    @GetMapping("/contactos")
    @PreAuthorize("hasAuthority('LIST_MIS_CONTACTOS')")
    public ResponseEntity<StandardResponseDto<List<ContactoResponseDto>>> listarContactos() {
        return ok(miTiendaService.listarContactos());
    }

    @PostMapping("/contactos")
    @PreAuthorize("hasAuthority('CREATE_MIS_CONTACTOS')")
    public ResponseEntity<StandardResponseDto<ContactoResponseDto>> crearContacto(@Valid @RequestBody MiContactoRequestDto request) {
        return ok(miTiendaService.crearContacto(request));
    }

    @PutMapping("/contactos/{id}")
    @PreAuthorize("hasAuthority('UPDATE_MIS_CONTACTOS')")
    public ResponseEntity<StandardResponseDto<ContactoResponseDto>> actualizarContacto(@PathVariable Long id, @Valid @RequestBody MiContactoRequestDto request) {
        return ok(miTiendaService.actualizarContacto(id, request));
    }

    @DeleteMapping("/contactos/{id}")
    @PreAuthorize("hasAuthority('DELETE_MIS_CONTACTOS')")
    public ResponseEntity<StandardResponseDto<Void>> eliminarContacto(@PathVariable Long id) {
        miTiendaService.eliminarContacto(id);
        return ok(null);
    }

    @GetMapping("/pedidos")
    @PreAuthorize("hasAuthority('LIST_PEDIDOS_TIENDA')")
    public ResponseEntity<StandardResponseDto<List<PedidoResponseDto>>> listarPedidos(
            @RequestParam(required = false) Integer numero,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int perPage) {
        StandardResponseDto<List<PedidoResponseDto>> response = new StandardResponseDto<>();
        var resultado = miTiendaService.listarPedidos(numero, page, perPage);
        response.setSuccess(true);
        response.setData(resultado.data());
        response.setErrors(null);
        response.setPagination(new Pagination(resultado.page(), resultado.perPage(), resultado.total()));
        return ResponseEntity.ok(response);
    }

    // Sugerencias del buscador de pedidos mientras se escribe el numero.
    @GetMapping("/pedidos/sugerencias")
    @PreAuthorize("hasAuthority('LIST_PEDIDOS_TIENDA')")
    public ResponseEntity<StandardResponseDto<List<PedidoResponseDto>>> sugerirPedidos(
            @RequestParam String numero,
            @RequestParam(defaultValue = "6") int limite) {
        return ok(miTiendaService.sugerirPedidos(numero, limite));
    }

    @GetMapping("/pedidos/{id}")
    @PreAuthorize("hasAuthority('LIST_PEDIDOS_TIENDA')")
    public ResponseEntity<StandardResponseDto<PedidoResponseDto>> obtenerPedido(@PathVariable Long id) {
        return ok(miTiendaService.obtenerPedido(id));
    }

    // Devuelve el binario del comprobante; el frontend lo pide con el token de sesion.
    @GetMapping("/pedidos/{id}/comprobante")
    @PreAuthorize("hasAuthority('LIST_PEDIDOS_TIENDA')")
    public ResponseEntity<byte[]> obtenerComprobantePedido(@PathVariable Long id) {
        ComprobantePedido comprobante = miTiendaService.obtenerComprobantePedido(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(comprobante.getContentType()))
                .body(comprobante.getArchivo());
    }

    @PutMapping("/pedidos/{id}/confirmar")
    @PreAuthorize("hasAuthority('UPDATE_PEDIDOS_TIENDA')")
    public ResponseEntity<StandardResponseDto<PedidoResponseDto>> confirmarPedido(@PathVariable Long id) {
        return ok(miTiendaService.confirmarPedido(id));
    }

    @PutMapping("/pedidos/{id}/enviar")
    @PreAuthorize("hasAuthority('UPDATE_PEDIDOS_TIENDA')")
    public ResponseEntity<StandardResponseDto<PedidoResponseDto>> enviarPedido(@PathVariable Long id) {
        return ok(miTiendaService.enviarPedido(id));
    }

    @PutMapping("/pedidos/{id}/entregar")
    @PreAuthorize("hasAuthority('UPDATE_PEDIDOS_TIENDA')")
    public ResponseEntity<StandardResponseDto<PedidoResponseDto>> entregarPedido(@PathVariable Long id) {
        return ok(miTiendaService.entregarPedido(id));
    }

    @PutMapping("/pedidos/{id}/cancelar")
    @PreAuthorize("hasAuthority('UPDATE_PEDIDOS_TIENDA')")
    public ResponseEntity<StandardResponseDto<PedidoResponseDto>> cancelarPedido(@PathVariable Long id) {
        return ok(miTiendaService.cancelarPedido(id));
    }

    @PostMapping("/cupones")
    @PreAuthorize("hasAuthority('CREATE_MIS_CUPONES')")
    public ResponseEntity<StandardResponseDto<CuponResponseDto>> crearCupon(@Valid @RequestBody CuponRequestDto request) {
        return ok(miTiendaService.crearCupon(request));
    }

    @GetMapping("/cupones")
    @PreAuthorize("hasAuthority('LIST_MIS_CUPONES')")
    public ResponseEntity<StandardResponseDto<List<CuponResponseDto>>> listarCupones(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int perPage) {
        StandardResponseDto<List<CuponResponseDto>> response = new StandardResponseDto<>();
        var resultado = miTiendaService.listarCupones(page, perPage);
        response.setSuccess(true);
        response.setData(resultado.data());
        response.setErrors(null);
        response.setPagination(new Pagination(resultado.page(), resultado.perPage(), resultado.total()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cupones/{id}")
    @PreAuthorize("hasAuthority('LIST_MIS_CUPONES')")
    public ResponseEntity<StandardResponseDto<CuponResponseDto>> obtenerCupon(@PathVariable Long id) {
        return ok(miTiendaService.obtenerCupon(id));
    }

    @DeleteMapping("/cupones/{id}")
    @PreAuthorize("hasAuthority('DELETE_MIS_CUPONES')")
    public ResponseEntity<StandardResponseDto<Void>> eliminarCupon(@PathVariable Long id) {
        miTiendaService.eliminarCupon(id);
        return ok(null);
    }

    @GetMapping("/publicaciones")
    @PreAuthorize("hasAuthority('LIST_MIS_PUBLICACIONES')")
    public ResponseEntity<StandardResponseDto<List<PublicacionResponseDto>>> listarPublicaciones(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int perPage) {
        StandardResponseDto<List<PublicacionResponseDto>> response = new StandardResponseDto<>();
        var resultado = miTiendaService.listarPublicaciones(page, perPage);
        response.setSuccess(true);
        response.setData(resultado.data());
        response.setErrors(null);
        response.setPagination(new Pagination(resultado.page(), resultado.perPage(), resultado.total()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/publicaciones/{id}")
    @PreAuthorize("hasAuthority('LIST_MIS_PUBLICACIONES')")
    public ResponseEntity<StandardResponseDto<PublicacionResponseDto>> obtenerPublicacion(@PathVariable Long id) {
        return ok(miTiendaService.obtenerPublicacion(id));
    }

    @PostMapping("/publicaciones")
    @PreAuthorize("hasAuthority('CREATE_MIS_PUBLICACIONES')")
    public ResponseEntity<StandardResponseDto<PublicacionResponseDto>> crearPublicacion(@Valid @RequestBody PublicacionRequestDto request) {
        return ok(miTiendaService.crearPublicacion(request));
    }

    @PutMapping("/publicaciones/{id}")
    @PreAuthorize("hasAuthority('UPDATE_MIS_PUBLICACIONES')")
    public ResponseEntity<StandardResponseDto<PublicacionResponseDto>> actualizarPublicacion(@PathVariable Long id, @Valid @RequestBody PublicacionRequestDto request) {
        return ok(miTiendaService.actualizarPublicacion(id, request));
    }

    @DeleteMapping("/publicaciones/{id}")
    @PreAuthorize("hasAuthority('DELETE_MIS_PUBLICACIONES')")
    public ResponseEntity<StandardResponseDto<Void>> eliminarPublicacion(@PathVariable Long id) {
        miTiendaService.eliminarPublicacion(id);
        return ok(null);
    }

    @GetMapping("/publicaciones/{id}/archivos")
    @PreAuthorize("hasAuthority('LIST_MIS_PUBLICACIONES')")
    public ResponseEntity<StandardResponseDto<List<ArchivoPublicacionResponseDto>>> listarArchivosPublicacion(@PathVariable Long id) {
        return ok(miTiendaService.listarArchivosPublicacion(id));
    }

    @PostMapping(value = "/publicaciones/{id}/archivos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyAuthority('CREATE_MIS_PUBLICACIONES', 'UPDATE_MIS_PUBLICACIONES')")
    public ResponseEntity<StandardResponseDto<ArchivoPublicacionResponseDto>> subirArchivoPublicacion(
            @PathVariable Long id,
            @RequestParam("archivo") MultipartFile archivo) {
        return ok(miTiendaService.subirArchivoPublicacion(id, archivo));
    }

    @DeleteMapping("/publicaciones/{id}/archivos/{idArchivo}")
    @PreAuthorize("hasAuthority('UPDATE_MIS_PUBLICACIONES')")
    public ResponseEntity<StandardResponseDto<Void>> eliminarArchivoPublicacion(@PathVariable Long id, @PathVariable Long idArchivo) {
        miTiendaService.eliminarArchivoPublicacion(id, idArchivo);
        return ok(null);
    }

    @DeleteMapping("/publicaciones/{id}/comentarios/{idComentario}")
    @PreAuthorize("hasAuthority('DELETE_COMENTARIOS_TIENDA')")
    public ResponseEntity<StandardResponseDto<Void>> eliminarComentarioPublicacion(@PathVariable Long id, @PathVariable Long idComentario) {
        miTiendaService.eliminarComentarioPublicacion(id, idComentario);
        return ok(null);
    }

    private <T> ResponseEntity<StandardResponseDto<T>> ok(T data) {
        StandardResponseDto<T> response = new StandardResponseDto<>();
        response.setSuccess(true);
        response.setData(data);
        response.setErrors(null);
        response.setPagination(null);
        return ResponseEntity.ok(response);
    }
}
