package com.marketplace.marketplace_backend.modules.mitienda;

import com.marketplace.marketplace_backend.common.Pagination;
import com.marketplace.marketplace_backend.common.StandardResponseDto;
import com.marketplace.marketplace_backend.modules.contacto.dto.ContactoResponseDto;
import com.marketplace.marketplace_backend.modules.imagenproducto.dto.ImagenProductoResponseDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiContactoRequestDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiProductoRequestDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiTiendaResponseDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiTiendaUpdateRequestDto;
import com.marketplace.marketplace_backend.modules.pedido.dto.PedidoResponseDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoResponseDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@AllArgsConstructor
@RequestMapping("/mi-tienda")
@RestController
// Endpoints REST para que un vendedor gestione su propia tienda. No usan permisos
// por rol: el acceso lo define el vinculo del usuario con la tienda (tienda_usuario),
// que se verifica en el service en cada operacion.
public class MiTiendaController {

    private final MiTiendaService miTiendaService;

    @GetMapping
    public ResponseEntity<StandardResponseDto<MiTiendaResponseDto>> obtenerTienda() {
        return ok(miTiendaService.obtenerTienda());
    }

    @PutMapping
    public ResponseEntity<StandardResponseDto<MiTiendaResponseDto>> actualizarTienda(@Valid @RequestBody MiTiendaUpdateRequestDto request) {
        return ok(miTiendaService.actualizarTienda(request));
    }

    @GetMapping("/productos")
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
    public ResponseEntity<StandardResponseDto<ProductoResponseDto>> obtenerProducto(@PathVariable Long id) {
        return ok(miTiendaService.obtenerProducto(id));
    }

    @PostMapping("/productos")
    public ResponseEntity<StandardResponseDto<ProductoResponseDto>> crearProducto(@Valid @RequestBody MiProductoRequestDto request) {
        return ok(miTiendaService.crearProducto(request));
    }

    @PutMapping("/productos/{id}")
    public ResponseEntity<StandardResponseDto<ProductoResponseDto>> actualizarProducto(@PathVariable Long id, @Valid @RequestBody MiProductoRequestDto request) {
        return ok(miTiendaService.actualizarProducto(id, request));
    }

    @DeleteMapping("/productos/{id}")
    public ResponseEntity<StandardResponseDto<Void>> eliminarProducto(@PathVariable Long id) {
        miTiendaService.eliminarProducto(id);
        return ok(null);
    }

    @GetMapping("/productos/{id}/imagenes")
    public ResponseEntity<StandardResponseDto<List<ImagenProductoResponseDto>>> listarImagenes(@PathVariable Long id) {
        return ok(miTiendaService.listarImagenes(id));
    }

    @PostMapping(value = "/productos/{id}/imagenes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StandardResponseDto<ImagenProductoResponseDto>> subirImagen(
            @PathVariable Long id,
            @RequestParam("archivo") MultipartFile archivo) {
        return ok(miTiendaService.subirImagen(id, archivo));
    }

    @DeleteMapping("/productos/{id}/imagenes/{idImagen}")
    public ResponseEntity<StandardResponseDto<Void>> eliminarImagen(@PathVariable Long id, @PathVariable Long idImagen) {
        miTiendaService.eliminarImagen(id, idImagen);
        return ok(null);
    }

    @GetMapping("/contactos")
    public ResponseEntity<StandardResponseDto<List<ContactoResponseDto>>> listarContactos() {
        return ok(miTiendaService.listarContactos());
    }

    @PostMapping("/contactos")
    public ResponseEntity<StandardResponseDto<ContactoResponseDto>> crearContacto(@Valid @RequestBody MiContactoRequestDto request) {
        return ok(miTiendaService.crearContacto(request));
    }

    @PutMapping("/contactos/{id}")
    public ResponseEntity<StandardResponseDto<ContactoResponseDto>> actualizarContacto(@PathVariable Long id, @Valid @RequestBody MiContactoRequestDto request) {
        return ok(miTiendaService.actualizarContacto(id, request));
    }

    @DeleteMapping("/contactos/{id}")
    public ResponseEntity<StandardResponseDto<Void>> eliminarContacto(@PathVariable Long id) {
        miTiendaService.eliminarContacto(id);
        return ok(null);
    }

    @GetMapping("/pedidos")
    public ResponseEntity<StandardResponseDto<List<PedidoResponseDto>>> listarPedidos(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int perPage) {
        StandardResponseDto<List<PedidoResponseDto>> response = new StandardResponseDto<>();
        var resultado = miTiendaService.listarPedidos(page, perPage);
        response.setSuccess(true);
        response.setData(resultado.data());
        response.setErrors(null);
        response.setPagination(new Pagination(resultado.page(), resultado.perPage(), resultado.total()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pedidos/{id}")
    public ResponseEntity<StandardResponseDto<PedidoResponseDto>> obtenerPedido(@PathVariable Long id) {
        return ok(miTiendaService.obtenerPedido(id));
    }

    @PutMapping("/pedidos/{id}/confirmar")
    public ResponseEntity<StandardResponseDto<PedidoResponseDto>> confirmarPedido(@PathVariable Long id) {
        return ok(miTiendaService.confirmarPedido(id));
    }

    @PutMapping("/pedidos/{id}/enviar")
    public ResponseEntity<StandardResponseDto<PedidoResponseDto>> enviarPedido(@PathVariable Long id) {
        return ok(miTiendaService.enviarPedido(id));
    }

    @PutMapping("/pedidos/{id}/entregar")
    public ResponseEntity<StandardResponseDto<PedidoResponseDto>> entregarPedido(@PathVariable Long id) {
        return ok(miTiendaService.entregarPedido(id));
    }

    @PutMapping("/pedidos/{id}/cancelar")
    public ResponseEntity<StandardResponseDto<PedidoResponseDto>> cancelarPedido(@PathVariable Long id) {
        return ok(miTiendaService.cancelarPedido(id));
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
