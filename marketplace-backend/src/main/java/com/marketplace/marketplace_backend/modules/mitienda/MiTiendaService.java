package com.marketplace.marketplace_backend.modules.mitienda;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.contacto.dto.ContactoResponseDto;
import com.marketplace.marketplace_backend.modules.cupon.dto.CuponRequestDto;
import com.marketplace.marketplace_backend.modules.cupon.dto.CuponResponseDto;
import com.marketplace.marketplace_backend.modules.imagenproducto.dto.ImagenProductoResponseDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiContactoRequestDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiProductoRequestDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiTiendaResponseDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiTiendaUpdateRequestDto;
import com.marketplace.marketplace_backend.modules.archivopublicacion.dto.ArchivoPublicacionResponseDto;
import com.marketplace.marketplace_backend.modules.pedido.dto.PedidoResponseDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoResponseDto;
import com.marketplace.marketplace_backend.modules.publicacion.dto.PublicacionRequestDto;
import com.marketplace.marketplace_backend.modules.publicacion.dto.PublicacionResponseDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

// Operaciones de negocio sobre la tienda que gestiona el usuario autenticado
public interface MiTiendaService {
    MiTiendaResponseDto obtenerTienda();

    MiTiendaResponseDto actualizarTienda(MiTiendaUpdateRequestDto request);

    PagedResult<List<ProductoResponseDto>> listarProductos(String nombre, int page, int perPage);

    ProductoResponseDto obtenerProducto(Long idProducto);

    ProductoResponseDto crearProducto(MiProductoRequestDto request);

    ProductoResponseDto actualizarProducto(Long idProducto, MiProductoRequestDto request);

    void eliminarProducto(Long idProducto);

    List<ImagenProductoResponseDto> listarImagenes(Long idProducto);

    ImagenProductoResponseDto subirImagen(Long idProducto, MultipartFile archivo);

    void eliminarImagen(Long idProducto, Long idImagen);

    List<ContactoResponseDto> listarContactos();

    ContactoResponseDto crearContacto(MiContactoRequestDto request);

    ContactoResponseDto actualizarContacto(Long idContacto, MiContactoRequestDto request);

    void eliminarContacto(Long idContacto);

    PagedResult<List<PedidoResponseDto>> listarPedidos(Integer numero, int page, int perPage);

    PedidoResponseDto obtenerPedido(Long idPedido);

    List<PedidoResponseDto> sugerirPedidos(String prefijoNumero, int limite);

    PedidoResponseDto confirmarPedido(Long idPedido);

    PedidoResponseDto enviarPedido(Long idPedido);

    PedidoResponseDto entregarPedido(Long idPedido);

    PedidoResponseDto cancelarPedido(Long idPedido);

    // Crear y eliminar cupones es solo del dueño (PRINCIPAL); listar/ver tambien lo puede
    // hacer el colaborador (SECUNDARIO), para repartir el codigo o QR a los clientes.
    CuponResponseDto crearCupon(CuponRequestDto request);

    PagedResult<List<CuponResponseDto>> listarCupones(int page, int perPage);

    CuponResponseDto obtenerCupon(Long idCupon);

    void eliminarCupon(Long idCupon);

    // ------------------------------------------------------------ Publicaciones

    PagedResult<List<PublicacionResponseDto>> listarPublicaciones(int page, int perPage);

    PublicacionResponseDto obtenerPublicacion(Long idPublicacion);

    PublicacionResponseDto crearPublicacion(PublicacionRequestDto request);

    PublicacionResponseDto actualizarPublicacion(Long idPublicacion, PublicacionRequestDto request);

    void eliminarPublicacion(Long idPublicacion);

    List<ArchivoPublicacionResponseDto> listarArchivosPublicacion(Long idPublicacion);

    ArchivoPublicacionResponseDto subirArchivoPublicacion(Long idPublicacion, MultipartFile archivo);

    void eliminarArchivoPublicacion(Long idPublicacion, Long idArchivo);

    // Moderacion: el dueño/colaborador de la tienda puede borrar comentarios ajenos
    // en sus propias publicaciones. Listarlos no hace falta aca: son publicos (ver ComentarioController).
    void eliminarComentario(Long idPublicacion, Long idComentario);
}
