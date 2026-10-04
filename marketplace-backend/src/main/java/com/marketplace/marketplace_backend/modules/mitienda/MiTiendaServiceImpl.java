package com.marketplace.marketplace_backend.modules.mitienda;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.barrio.Barrio;
import com.marketplace.marketplace_backend.modules.barrio.BarrioRepository;
import com.marketplace.marketplace_backend.modules.contacto.Contacto;
import com.marketplace.marketplace_backend.modules.contacto.ContactoRepository;
import com.marketplace.marketplace_backend.modules.contacto.ContactoService;
import com.marketplace.marketplace_backend.modules.contacto.dto.ContactoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.contacto.dto.ContactoFilterDto;
import com.marketplace.marketplace_backend.modules.contacto.dto.ContactoResponseDto;
import com.marketplace.marketplace_backend.modules.direccion.Direccion;
import com.marketplace.marketplace_backend.modules.direccion.DireccionRepository;
import com.marketplace.marketplace_backend.modules.imagenproducto.ImagenProducto;
import com.marketplace.marketplace_backend.modules.imagenproducto.ImagenProductoRepository;
import com.marketplace.marketplace_backend.modules.imagenproducto.ImagenProductoService;
import com.marketplace.marketplace_backend.modules.imagenproducto.dto.ImagenProductoResponseDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiContactoRequestDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiProductoRequestDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiTiendaResponseDto;
import com.marketplace.marketplace_backend.modules.mitienda.dto.MiTiendaUpdateRequestDto;
import com.marketplace.marketplace_backend.modules.producto.Producto;
import com.marketplace.marketplace_backend.modules.producto.ProductoRepository;
import com.marketplace.marketplace_backend.modules.producto.ProductoService;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoFilterDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoResponseDto;
import com.marketplace.marketplace_backend.modules.producto.dto.ProductoUpdateRequestDto;
import com.marketplace.marketplace_backend.modules.productosubcategoria.ProductoSubcategoria;
import com.marketplace.marketplace_backend.modules.productosubcategoria.ProductoSubcategoriaRepository;
import com.marketplace.marketplace_backend.modules.productosubcategoria.ProductoSubcategoriaService;
import com.marketplace.marketplace_backend.modules.subcategoria.SubcategoriaRepository;
import com.marketplace.marketplace_backend.modules.tienda.Tienda;
import com.marketplace.marketplace_backend.modules.tienda.TiendaRepository;
import com.marketplace.marketplace_backend.modules.tiendausuario.TiendaUsuario;
import com.marketplace.marketplace_backend.modules.tiendausuario.TiendaUsuarioRepository;
import com.marketplace.marketplace_backend.modules.tiendausuario.TipoVinculoTienda;
import com.marketplace.marketplace_backend.modules.tipocontacto.TipoContacto;
import com.marketplace.marketplace_backend.modules.tipocontacto.TipoContactoRepository;
import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@AllArgsConstructor
@Service
// Implementación de la gestión de la propia tienda. La tienda se obtiene siempre
// del vinculo del usuario autenticado (tienda_usuario), nunca de un id recibido,
// y cada producto, imagen o contacto se verifica contra esa tienda antes de
// delegar en los servicios existentes. El dueño (PRINCIPAL) gestiona todo; el
// colaborador (SECUNDARIO) solo productos e imagenes.
public class MiTiendaServiceImpl implements MiTiendaService {

    private static final Set<String> TIPOS_IMAGEN_PERMITIDOS = Set.of("image/png", "image/jpeg");

    private final UsuarioRepository usuarioRepository;
    private final TiendaUsuarioRepository tiendaUsuarioRepository;
    private final TiendaRepository tiendaRepository;
    private final DireccionRepository direccionRepository;
    private final BarrioRepository barrioRepository;
    private final ProductoRepository productoRepository;
    private final ProductoService productoService;
    private final ProductoSubcategoriaRepository productoSubcategoriaRepository;
    private final ProductoSubcategoriaService productoSubcategoriaService;
    private final SubcategoriaRepository subcategoriaRepository;
    private final ImagenProductoRepository imagenProductoRepository;
    private final ImagenProductoService imagenProductoService;
    private final ContactoRepository contactoRepository;
    private final ContactoService contactoService;
    private final TipoContactoRepository tipoContactoRepository;

    // ---------------------------------------------------------------- Tienda

    @Override
    @Transactional(readOnly = true)
    public MiTiendaResponseDto obtenerTienda() {
        TiendaUsuario vinculo = vinculoActual();
        return toResponse(vinculo.getTienda(), vinculo.getTipo());
    }

    @Override
    @Transactional
    public MiTiendaResponseDto actualizarTienda(MiTiendaUpdateRequestDto request) {
        Tienda tienda = tiendaDelDueno();

        boolean hayEdificio = request.getNombreEdificio() != null && !request.getNombreEdificio().isBlank();

        if (!hayEdificio && request.getNroCasa() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El número de casa es obligatorio si no se indica un edificio");
        }

        if (hayEdificio && (request.getNroDepartamento() == null || request.getNroDepartamento().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El número de departamento es obligatorio si se indica un edificio");
        }

        Direccion direccionActual = tienda.getDireccion();
        Barrio barrio = request.getIdBarrio() == null
                ? direccionActual.getBarrio()
                : barrioRepository.findById(request.getIdBarrio())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barrio no encontrado"));

        // La direccion se edita en el lugar solo si es exclusiva de esta tienda;
        // si la comparte con un usuario u otra tienda, se crea una nueva para no
        // modificar datos ajenos.
        boolean direccionExclusiva = tiendaRepository.countByDireccion_Id(direccionActual.getId()) == 1
                && usuarioRepository.countByDireccion_Id(direccionActual.getId()) == 0;
        Direccion direccion = direccionExclusiva ? direccionActual : new Direccion();
        direccion.setCalle(request.getCalle().trim());
        direccion.setNombreEdificio(hayEdificio ? request.getNombreEdificio().trim() : null);
        direccion.setNroCasa(hayEdificio ? null : request.getNroCasa());
        direccion.setNroDepartamento(hayEdificio ? request.getNroDepartamento().trim() : null);
        direccion.setBarrio(barrio);

        tienda.setDireccion(direccionRepository.save(direccion));
        tienda.setNombre(request.getNombre().trim());
        tienda.setDescripcion(request.getDescripcion().trim());

        return toResponse(tiendaRepository.save(tienda), TipoVinculoTienda.PRINCIPAL);
    }

    // ------------------------------------------------------------- Productos

    @Override
    public PagedResult<List<ProductoResponseDto>> listarProductos(String nombre, int page, int perPage) {
        ProductoFilterDto filtro = new ProductoFilterDto();
        filtro.setIdTienda(vinculoActual().getTienda().getId());
        filtro.setNombre(nombre);
        filtro.setPage(Math.max(page, 1));
        filtro.setPerPage(Math.min(Math.max(perPage, 1), 100));
        return productoService.findAll(filtro);
    }

    @Override
    public ProductoResponseDto obtenerProducto(Long idProducto) {
        productoDeMiTienda(idProducto);
        return productoService.get(idProducto);
    }

    @Override
    @Transactional
    public ProductoResponseDto crearProducto(MiProductoRequestDto request) {
        Long idTienda = vinculoActual().getTienda().getId();

        ProductoCreateRequestDto datos = new ProductoCreateRequestDto();
        datos.setNombre(request.getNombre().trim());
        datos.setDescripcion(request.getDescripcion().trim());
        datos.setPrecio(request.getPrecio());
        datos.setDescuento(request.getDescuento() == null ? 0.0 : request.getDescuento());
        datos.setCantidadDisponible(request.getCantidadDisponible());
        datos.setIdTienda(idTienda);

        ProductoResponseDto creado = productoService.create(datos);
        sincronizarSubcategorias(creado.getId(), request.getIdsSubcategorias());
        return productoService.get(creado.getId());
    }

    @Override
    @Transactional
    public ProductoResponseDto actualizarProducto(Long idProducto, MiProductoRequestDto request) {
        productoDeMiTienda(idProducto);

        // No se envian puntuacion ni idTienda: el vendedor no puede cambiarlos.
        ProductoUpdateRequestDto datos = new ProductoUpdateRequestDto();
        datos.setNombre(request.getNombre().trim());
        datos.setDescripcion(request.getDescripcion().trim());
        datos.setPrecio(request.getPrecio());
        datos.setDescuento(request.getDescuento() == null ? 0.0 : request.getDescuento());
        datos.setCantidadDisponible(request.getCantidadDisponible());

        productoService.update(idProducto, datos);
        sincronizarSubcategorias(idProducto, request.getIdsSubcategorias());
        return productoService.get(idProducto);
    }

    @Override
    @Transactional
    public void eliminarProducto(Long idProducto) {
        productoDeMiTienda(idProducto);

        // Las imagenes tambien se dan de baja para no dejarlas huerfanas.
        LocalDateTime ahora = LocalDateTime.now();
        List<ImagenProducto> imagenes = imagenProductoRepository.findByProducto_IdOrderByIdAsc(idProducto);
        imagenes.forEach(imagen -> imagen.setDeletedAt(ahora));
        imagenProductoRepository.saveAll(imagenes);

        productoService.delete(idProducto);
    }

    // Reemplaza las subcategorias del producto por las recibidas (null = no cambiar).
    private void sincronizarSubcategorias(Long idProducto, List<Long> idsSubcategorias) {
        if (idsSubcategorias == null) {
            return;
        }

        Set<Long> deseadas = new HashSet<>(idsSubcategorias);
        for (Long idSubcategoria : deseadas) {
            if (idSubcategoria == null || !subcategoriaRepository.existsById(idSubcategoria)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subcategoría no encontrada: " + idSubcategoria);
            }
        }

        Set<Long> actuales = new HashSet<>(productoSubcategoriaRepository.findByProducto_Id(idProducto).stream()
                .map(ProductoSubcategoria::getSubcategoria)
                .map(subcategoria -> subcategoria.getId())
                .toList());

        for (Long idSubcategoria : actuales) {
            if (!deseadas.contains(idSubcategoria)) {
                productoSubcategoriaService.delete(idProducto, idSubcategoria);
            }
        }

        for (Long idSubcategoria : deseadas) {
            if (!actuales.contains(idSubcategoria)) {
                productoSubcategoriaService.create(idProducto, idSubcategoria);
            }
        }
    }

    // -------------------------------------------------------------- Imagenes

    @Override
    public List<ImagenProductoResponseDto> listarImagenes(Long idProducto) {
        productoDeMiTienda(idProducto);
        return imagenProductoService.listByProducto(idProducto);
    }

    @Override
    @Transactional
    public ImagenProductoResponseDto subirImagen(Long idProducto, MultipartFile archivo) {
        productoDeMiTienda(idProducto);

        if (archivo == null || archivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo no puede estar vacío");
        }

        if (!TIPOS_IMAGEN_PERMITIDOS.contains(archivo.getContentType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo se permiten imágenes PNG o JPG");
        }

        return imagenProductoService.create(idProducto, archivo);
    }

    @Override
    @Transactional
    public void eliminarImagen(Long idProducto, Long idImagen) {
        productoDeMiTienda(idProducto);

        ImagenProducto imagen = imagenProductoRepository.findById(idImagen)
                .filter(encontrada -> encontrada.getProducto().getId().equals(idProducto))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Imagen no encontrada"));

        imagenProductoService.delete(imagen.getId());
    }

    // ------------------------------------------------------------- Contactos

    @Override
    public List<ContactoResponseDto> listarContactos() {
        ContactoFilterDto filtro = new ContactoFilterDto();
        filtro.setIdTienda(tiendaDelDueno().getId());
        filtro.setPage(1);
        filtro.setPerPage(100);
        return contactoService.findAll(filtro).data();
    }

    @Override
    @Transactional
    public ContactoResponseDto crearContacto(MiContactoRequestDto request) {
        ContactoCreateRequestDto datos = new ContactoCreateRequestDto();
        datos.setEnlace(request.getEnlace().trim());
        datos.setUsuario(request.getUsuario().trim());
        datos.setNroTelefono(normalizarTelefono(request.getNroTelefono()));
        datos.setIdTipoContacto(request.getIdTipoContacto());
        datos.setIdTienda(tiendaDelDueno().getId());
        return contactoService.create(datos);
    }

    @Override
    @Transactional
    public ContactoResponseDto actualizarContacto(Long idContacto, MiContactoRequestDto request) {
        Contacto contacto = contactoDeMiTienda(idContacto);

        TipoContacto tipoContacto = tipoContactoRepository.findById(request.getIdTipoContacto())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tipo de contacto no encontrado"));

        // Se actualiza directo (no via ContactoService.update) para permitir
        // borrar el telefono, que en el update general null significa "no cambiar".
        contacto.setEnlace(request.getEnlace().trim());
        contacto.setUsuario(request.getUsuario().trim());
        contacto.setNroTelefono(normalizarTelefono(request.getNroTelefono()));
        contacto.setTipoContacto(tipoContacto);
        contactoRepository.save(contacto);

        return contactoService.get(idContacto);
    }

    @Override
    @Transactional
    public void eliminarContacto(Long idContacto) {
        contactoDeMiTienda(idContacto);
        contactoService.delete(idContacto);
    }

    private String normalizarTelefono(String nroTelefono) {
        return nroTelefono == null || nroTelefono.isBlank() ? null : nroTelefono.trim();
    }

    // ------------------------------------------------------- Verificaciones

    private TiendaUsuario vinculoActual() {
        String nombreUsuario = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario usuario = usuarioRepository.findByUsuarioIgnoreCase(nombreUsuario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));

        return tiendaUsuarioRepository.findFirstByUsuario_Id(usuario.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No gestionás ninguna tienda"));
    }

    private Tienda tiendaDelDueno() {
        TiendaUsuario vinculo = vinculoActual();
        if (vinculo.getTipo() != TipoVinculoTienda.PRINCIPAL) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el dueño de la tienda puede realizar esta acción");
        }
        return vinculo.getTienda();
    }

    private Producto productoDeMiTienda(Long idProducto) {
        Long idTienda = vinculoActual().getTienda().getId();
        return productoRepository.findById(idProducto)
                .filter(producto -> producto.getTienda().getId().equals(idTienda))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
    }

    private Contacto contactoDeMiTienda(Long idContacto) {
        Long idTienda = tiendaDelDueno().getId();
        return contactoRepository.findById(idContacto)
                .filter(contacto -> contacto.getTienda().getId().equals(idTienda))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contacto no encontrado"));
    }

    private MiTiendaResponseDto toResponse(Tienda tienda, TipoVinculoTienda tipoVinculo) {
        Direccion direccion = tienda.getDireccion();
        Barrio barrio = direccion.getBarrio();
        var ciudad = barrio.getCiudad();
        var departamento = ciudad.getDepartamento();
        var pais = departamento.getPais();

        return new MiTiendaResponseDto(
                tienda.getId(),
                tienda.getNombre(),
                tienda.getDescripcion(),
                tipoVinculo,
                direccion.getCalle(),
                direccion.getNombreEdificio(),
                direccion.getNroCasa(),
                direccion.getNroDepartamento(),
                barrio.getId(),
                barrio.getNombre(),
                ciudad.getId(),
                ciudad.getNombre(),
                departamento.getId(),
                departamento.getNombre(),
                pais.getId(),
                pais.getNombre()
        );
    }
}
