package com.marketplace.marketplace_backend.modules.mitienda;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.contacto.dto.ContactoResponseDto;
import com.marketplace.marketplace_backend.modules.imagenproducto.dto.ImagenProductoResponseDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiContactoRequestDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiProductoRequestDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiTiendaResponseDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiTiendaUpdateRequestDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoResponseDto;
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
}
