package com.marketplace.marketplace_backend.modules.producto;

import com.marketplace.marketplace_backend.modules.pedido.ProductoPedidoRepository;
import com.marketplace.marketplace_backend.modules.pedido.EstadoPedido;
import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.categoriasubcategoria.CategoriaSubcategoriaRepository;
import com.marketplace.marketplace_backend.modules.imagenproducto.ImagenProducto;
import com.marketplace.marketplace_backend.modules.imagenproducto.ImagenProductoRepository;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoFilterDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoResponseDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoUpdateRequestDto;
import com.marketplace.marketplace_backend.modules.productosubcategoria.ProductoSubcategoria;
import com.marketplace.marketplace_backend.modules.productosubcategoria.ProductoSubcategoriaRepository;
import com.marketplace.marketplace_backend.modules.tienda.Tienda;
import com.marketplace.marketplace_backend.modules.tienda.TiendaRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@Service
// Implementación de la lógica de negocio para gestionar productos
public class ProductoServiceImpl implements ProductoService {


    private final ProductoRepository productoRepository;
    private final TiendaRepository tiendaRepository;
    private final ProductoSubcategoriaRepository productoSubcategoriaRepository;
    private final CategoriaSubcategoriaRepository categoriaSubcategoriaRepository;
    private final ImagenProductoRepository imagenProductoRepository;
    private final ProductoPedidoRepository productoPedidoRepository;

    @Override
    @Transactional
    public ProductoResponseDto create(ProductoCreateRequestDto request) {
        Tienda tienda = tiendaRepository.findById(request.getIdTienda())
                .orElseThrow(() -> new EntityNotFoundException("Tienda no encontrada"));

        Producto producto = new Producto();
        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setPrecio(request.getPrecio());
        producto.setPuntuacion(request.getPuntuacion());
        producto.setDescuento(request.getDescuento());
        producto.setCantidadDisponible(request.getCantidadDisponible());
        producto.setTienda(tienda);
        Producto saved = productoRepository.save(producto);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public ProductoResponseDto update(Long id, ProductoUpdateRequestDto request) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));

        if (request.getNombre() != null) {
            producto.setNombre(request.getNombre());
        }

        if (request.getDescripcion() != null) {
            producto.setDescripcion(request.getDescripcion());
        }

        if (request.getPrecio() != null) {
            producto.setPrecio(request.getPrecio());
        }

        if (request.getPuntuacion() != null) {
            producto.setPuntuacion(request.getPuntuacion());
        }

        if (request.getDescuento() != null) {
            producto.setDescuento(request.getDescuento());
        }

        if (request.getCantidadDisponible() != null) {
            producto.setCantidadDisponible(request.getCantidadDisponible());
        }

        if (request.getIdTienda() != null) {
            Tienda tienda = tiendaRepository.findById(request.getIdTienda())
                    .orElseThrow(() -> new EntityNotFoundException("Tienda no encontrada"));
            producto.setTienda(tienda);
        }

        Producto updated = productoRepository.save(producto);
        return toResponse(updated);
    }

    @Override
    public ProductoResponseDto get(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));
        return toResponse(producto);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));

        exigirSinPedidosPendientes(id, "eliminar");

        producto.setDeletedAt(LocalDateTime.now());
        productoRepository.save(producto);
    }

    @Override
    @Transactional
    public ProductoResponseDto cambiarActivo(Long id, boolean activo) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));
        if (!activo) {
            exigirSinPedidosPendientes(id, "desactivar");
        }
        producto.setActivo(activo);
        return toResponse(productoRepository.save(producto));
    }

    // Un pedido pendiente todavia se tiene que confirmar, y eso descuenta el stock del
    // producto: se resuelven antes de sacarlo de la venta. Con pedidos confirmados,
    // enviados o terminados se puede, porque esos pedidos ya no dependen del producto
    // (guardan nombre y precio, y al cancelarlos el stock se devuelve igual).
    private void exigirSinPedidosPendientes(Long idProducto, String accion) {
        long pendientes = productoPedidoRepository.countByProducto_IdAndPedido_EstadoIn(
                idProducto, List.of(EstadoPedido.PENDIENTE));
        if (pendientes > 0) {
            throw new IllegalStateException("No se puede " + accion + " el producto: está en " + pendientes
                    + (pendientes == 1
                            ? " pedido pendiente. Confirmalo o cancelalo primero."
                            : " pedidos pendientes. Confirmalos o cancelalos primero."));
        }
    }

    @Override
    public PagedResult<List<ProductoResponseDto>> findAll(ProductoFilterDto filter) {
        int page = filter.getPage();
        int perPage = filter.getPerPage();

        Pageable pageable = PageRequest.of(page - 1, perPage);

        String nombre = filter.getNombre();
        if (nombre != null) {
            nombre = nombre.trim();
            if (nombre.isEmpty()) nombre = null;
        }

        Long idTienda = filter.getIdTienda();
        Long idCategoria = filter.getIdCategoria();
        Long idSubcategoria = filter.getIdSubcategoria();

        boolean hasNombre = nombre != null;
        boolean hasIdTienda = idTienda != null;
        boolean hasFiltroCategoria = idCategoria != null || idSubcategoria != null;

        List<Long> idsElegibles = null;
        if (hasFiltroCategoria) {
            idsElegibles = resolverProductosPorCategoriaOSubcategoria(idCategoria, idSubcategoria);

            if (idsElegibles.isEmpty()) {
                return new PagedResult<>(List.of(), page, perPage, 0);
            }
        }

        // Una sola consulta con filtros opcionales; los inactivos solo se incluyen cuando
        // quien lista es el dueño de la tienda o un administrador (lo decide el llamador).
        boolean filtrarIds = idsElegibles != null;
        Page<Producto> result = productoRepository.buscar(
                hasNombre ? escaparLike(nombre.toLowerCase()) : "",
                hasIdTienda,
                hasIdTienda ? idTienda : 0L,
                filtrarIds,
                filtrarIds ? idsElegibles : List.of(0L),
                !Boolean.FALSE.equals(filter.getSoloActivos()),
                pageable);

        List<ProductoResponseDto> data = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) result.getTotalElements());
    }

    private static String escaparLike(String texto) {
        return texto.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    // Resuelve los ids de producto elegibles a partir de idCategoria y/o idSubcategoria.
    // idSubcategoria es directo y preciso; idCategoria pasa por las subcategorias de esa categoria.
    // Si vienen los dos, se intersecan.
    private List<Long> resolverProductosPorCategoriaOSubcategoria(Long idCategoria, Long idSubcategoria) {
        List<Long> porSubcategoria = null;
        if (idSubcategoria != null) {
            porSubcategoria = productoSubcategoriaRepository.findBySubcategoria_Id(idSubcategoria).stream()
                    .map(ps -> ps.getProducto().getId())
                    .distinct()
                    .toList();
        }

        List<Long> porCategoria = null;
        if (idCategoria != null) {
            List<Long> idsSubcategoriaDeCategoria = categoriaSubcategoriaRepository.findByCategoria_Id(idCategoria).stream()
                    .map(cs -> cs.getSubcategoria().getId())
                    .toList();

            porCategoria = productoSubcategoriaRepository.findBySubcategoria_IdIn(idsSubcategoriaDeCategoria).stream()
                    .map(ProductoSubcategoria::getProducto)
                    .map(Producto::getId)
                    .distinct()
                    .toList();
        }

        if (porSubcategoria != null && porCategoria != null) {
            return porSubcategoria.stream().filter(porCategoria::contains).toList();
        }

        return porSubcategoria != null ? porSubcategoria : porCategoria;
    }

    // Precio con el descuento (porcentaje) ya aplicado; sin descuento devuelve el precio tal cual.
    private static Double precioFinal(Producto producto) {
        Double descuento = producto.getDescuento();
        if (descuento == null || descuento <= 0) {
            return producto.getPrecio();
        }
        return producto.getPrecio() * (1 - descuento / 100);
    }

    private ProductoResponseDto toResponse(Producto producto) {
        List<ProductoSubcategoria> subcategorias = productoSubcategoriaRepository.findByProducto_Id(producto.getId());
        List<Long> idsSubcategorias = subcategorias.stream()
                .map(ps -> ps.getSubcategoria().getId())
                .toList();
        List<String> nombresSubcategorias = subcategorias.stream()
                .map(ps -> ps.getSubcategoria().getNombre())
                .toList();

        Long idImagenPrincipal = imagenProductoRepository.findFirstByProducto_IdOrderByIdAsc(producto.getId())
                .map(ImagenProducto::getId)
                .orElse(null);

        return new ProductoResponseDto(
                producto.getId(),
                producto.getNombre(),
                producto.getDescripcion(),
                producto.getPrecio(),
                precioFinal(producto),
                producto.getPuntuacion(),
                producto.getDescuento(),
                producto.getCantidadDisponible(),
                producto.getTienda().getId(),
                producto.getTienda().getNombre(),
                idsSubcategorias,
                nombresSubcategorias,
                idImagenPrincipal,
                !Boolean.FALSE.equals(producto.getActivo()),
                !Boolean.FALSE.equals(producto.getTienda().getActivo()),
                producto.getCreatedAt(),
                producto.getUpdatedAt()
        );
    }
}
