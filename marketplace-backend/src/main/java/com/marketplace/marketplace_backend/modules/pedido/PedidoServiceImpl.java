package com.marketplace.marketplace_backend.modules.pedido;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.barrio.Barrio;
import com.marketplace.marketplace_backend.modules.barrio.BarrioRepository;
import com.marketplace.marketplace_backend.modules.cupon.Cupon;
import com.marketplace.marketplace_backend.modules.cupon.CuponRepository;
import com.marketplace.marketplace_backend.modules.direccion.Direccion;
import com.marketplace.marketplace_backend.modules.pedido.dto.PedidoCreateRequestDto;
import com.marketplace.marketplace_backend.modules.pedido.dto.PedidoItemRequestDto;
import com.marketplace.marketplace_backend.modules.pedido.dto.PedidoResponseDto;
import com.marketplace.marketplace_backend.modules.pedido.dto.ProductoPedidoResponseDto;
import com.marketplace.marketplace_backend.modules.producto.Producto;
import com.marketplace.marketplace_backend.modules.producto.ProductoRepository;
import com.marketplace.marketplace_backend.modules.tienda.Tienda;
import com.marketplace.marketplace_backend.modules.tienda.TiendaRepository;
import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
// Implementacion de pedidos. Los datos de entrega se arman como una foto del pedido: si hay
// sesion se completan con los de la cuenta (o se pisa la direccion si el usuario eligio
// "añadir direccion de envio"), y si es invitado se exigen completos en el request. El stock
// se valida al crear y recien se descuenta al confirmar; se devuelve si se cancela desde
// CONFIRMADO. Cancelar solo esta permitido desde PENDIENTE o CONFIRMADO.
public class PedidoServiceImpl implements PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ProductoPedidoRepository productoPedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final TiendaRepository tiendaRepository;
    private final ProductoRepository productoRepository;
    private final BarrioRepository barrioRepository;
    private final CuponRepository cuponRepository;
    private final JavaMailSender mailSender;
    private final String remitente;

    public PedidoServiceImpl(
            PedidoRepository pedidoRepository,
            ProductoPedidoRepository productoPedidoRepository,
            UsuarioRepository usuarioRepository,
            TiendaRepository tiendaRepository,
            ProductoRepository productoRepository,
            BarrioRepository barrioRepository,
            CuponRepository cuponRepository,
            JavaMailSender mailSender,
            @Value("${spring.mail.username}") String remitente) {
        this.pedidoRepository = pedidoRepository;
        this.productoPedidoRepository = productoPedidoRepository;
        this.usuarioRepository = usuarioRepository;
        this.tiendaRepository = tiendaRepository;
        this.productoRepository = productoRepository;
        this.barrioRepository = barrioRepository;
        this.cuponRepository = cuponRepository;
        this.mailSender = mailSender;
        this.remitente = remitente;
    }

    @Override
    @Transactional
    public PedidoResponseDto crear(PedidoCreateRequestDto request) {
        Usuario usuario = usuarioAutenticadoOpcional();

        Tienda tienda = tiendaRepository.findById(request.getIdTienda())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tienda no encontrada"));

        DatosEntrega entrega = resolverDatosEntrega(usuario, request);

        List<ProductoPedido> lineas = new ArrayList<>();
        double total = 0;
        for (PedidoItemRequestDto item : request.getItems()) {
            Producto producto = productoRepository.findById(item.getIdProducto())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado: " + item.getIdProducto()));

            if (!producto.getTienda().getId().equals(tienda.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El producto " + producto.getNombre() + " no pertenece a la tienda indicada");
            }
            if (producto.getCantidadDisponible() < item.getCantidad()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No hay stock suficiente de " + producto.getNombre());
            }

            double precioUnitario = precioFinal(producto);
            double subtotal = precioUnitario * item.getCantidad();
            ProductoPedido linea = new ProductoPedido();
            linea.setProducto(producto);
            linea.setCantidad(item.getCantidad());
            linea.setPrecioUnitario(precioUnitario);
            linea.setTotal(subtotal);
            lineas.add(linea);
            total += subtotal;
        }

        Cupon cupon = resolverCupon(request.getCodigoCupon(), tienda);
        if (cupon != null) {
            total -= total * cupon.getPorcentaje() / 100;
        }

        Pedido pedido = new Pedido();
        pedido.setUsuario(usuario);
        pedido.setTienda(tienda);
        pedido.setNombreReceptor(entrega.nombreReceptor);
        pedido.setTelefonoReceptor(entrega.telefonoReceptor);
        pedido.setEmailReceptor(entrega.emailReceptor);
        pedido.setBarrio(entrega.barrio);
        pedido.setDireccion(entrega.direccion);
        pedido.setReferencia(request.getReferencia() == null || request.getReferencia().isBlank() ? null : request.getReferencia().trim());
        pedido.setTotal(total);
        pedido.setFechaPedido(LocalDateTime.now());
        pedido.setEstado(EstadoPedido.PENDIENTE);
        Pedido guardado = pedidoRepository.save(pedido);

        lineas.forEach(linea -> linea.setPedido(guardado));
        productoPedidoRepository.saveAll(lineas);

        if (cupon != null) {
            cupon.setPedido(guardado);
            cuponRepository.save(cupon);
        }

        if (usuario == null) {
            enviarCorreoConfirmacion(guardado, lineas);
        }

        return toResponse(guardado);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResult<List<PedidoResponseDto>> listarMios(int page, int perPage) {
        Usuario usuario = usuarioAutenticado();
        PageRequest pageable = PageRequest.of(Math.max(page, 1) - 1, Math.max(perPage, 1));
        Page<Pedido> resultado = pedidoRepository.findByUsuario_IdOrderByIdDesc(usuario.getId(), pageable);
        return paginar(resultado, page, perPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PedidoResponseDto obtenerMio(Long id) {
        Usuario usuario = usuarioAutenticado();
        Pedido pedido = pedidoRepository.findByIdAndUsuario_Id(id, usuario.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));
        return toResponse(pedido);
    }

    @Override
    @Transactional
    public PedidoResponseDto cancelarMio(Long id) {
        Usuario usuario = usuarioAutenticado();
        Pedido pedido = pedidoRepository.findByIdAndUsuario_Id(id, usuario.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));
        cancelar(pedido);
        return toResponse(pedidoRepository.save(pedido));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResult<List<PedidoResponseDto>> listarDeTienda(Long idTienda, int page, int perPage) {
        PageRequest pageable = PageRequest.of(Math.max(page, 1) - 1, Math.max(perPage, 1));
        Page<Pedido> resultado = pedidoRepository.findByTienda_IdOrderByIdDesc(idTienda, pageable);
        return paginar(resultado, page, perPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PedidoResponseDto obtenerDeTienda(Long idTienda, Long id) {
        return toResponse(buscarDeTienda(idTienda, id));
    }

    @Override
    @Transactional
    public PedidoResponseDto confirmar(Long idTienda, Long id) {
        Pedido pedido = buscarDeTienda(idTienda, id);
        exigirEstado(pedido, EstadoPedido.PENDIENTE, "confirmar");

        List<ProductoPedido> lineas = productoPedidoRepository.findByPedido_IdOrderByIdAsc(pedido.getId());
        for (ProductoPedido linea : lineas) {
            if (linea.getProducto().getCantidadDisponible() < linea.getCantidad()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "No hay stock suficiente de " + linea.getProducto().getNombre() + " para confirmar el pedido");
            }
        }
        for (ProductoPedido linea : lineas) {
            Producto producto = linea.getProducto();
            producto.setCantidadDisponible(producto.getCantidadDisponible() - linea.getCantidad());
            productoRepository.save(producto);
        }

        pedido.setEstado(EstadoPedido.CONFIRMADO);
        return toResponse(pedidoRepository.save(pedido));
    }

    @Override
    @Transactional
    public PedidoResponseDto enviar(Long idTienda, Long id) {
        Pedido pedido = buscarDeTienda(idTienda, id);
        exigirEstado(pedido, EstadoPedido.CONFIRMADO, "enviar");
        pedido.setEstado(EstadoPedido.ENVIADO);
        return toResponse(pedidoRepository.save(pedido));
    }

    @Override
    @Transactional
    public PedidoResponseDto entregar(Long idTienda, Long id) {
        Pedido pedido = buscarDeTienda(idTienda, id);
        exigirEstado(pedido, EstadoPedido.ENVIADO, "entregar");
        pedido.setEstado(EstadoPedido.ENTREGADO);
        pedido.setFechaEntrega(LocalDateTime.now());
        return toResponse(pedidoRepository.save(pedido));
    }

    @Override
    @Transactional
    public PedidoResponseDto cancelarDeTienda(Long idTienda, Long id) {
        Pedido pedido = buscarDeTienda(idTienda, id);
        cancelar(pedido);
        return toResponse(pedidoRepository.save(pedido));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResult<List<PedidoResponseDto>> listarTodos(int page, int perPage) {
        PageRequest pageable = PageRequest.of(Math.max(page, 1) - 1, Math.max(perPage, 1));
        Page<Pedido> resultado = pedidoRepository.findAllByOrderByIdDesc(pageable);
        return paginar(resultado, page, perPage);
    }

    // ------------------------------------------------------------- Privados

    private record DatosEntrega(String nombreReceptor, String telefonoReceptor, String emailReceptor, Barrio barrio, String direccion) {}

    private DatosEntrega resolverDatosEntrega(Usuario usuario, PedidoCreateRequestDto request) {
        if (usuario != null) {
            Barrio barrio;
            String direccion;
            if (request.getIdBarrio() != null) {
                // El usuario eligio "añadir direccion de envio": usa lo que mando en el request.
                barrio = barrioRepository.findById(request.getIdBarrio())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barrio no encontrado"));
                if (esVacio(request.getDireccion())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La dirección es obligatoria");
                }
                direccion = request.getDireccion().trim();
            } else {
                // El usuario eligio "mi direccion": usa la de su cuenta.
                Direccion direccionUsuario = usuario.getDireccion();
                barrio = direccionUsuario.getBarrio();
                direccion = formatearDireccion(direccionUsuario);
            }
            return new DatosEntrega(
                    usuario.getNombre() + " " + usuario.getApellido(),
                    usuario.getTelefono(),
                    usuario.getEmail(),
                    barrio,
                    direccion
            );
        }

        if (esVacio(request.getNombreReceptor())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre es obligatorio");
        }
        if (esVacio(request.getTelefonoReceptor())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El teléfono es obligatorio");
        }
        if (esVacio(request.getEmailReceptor())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El email es obligatorio");
        }
        if (request.getIdBarrio() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El barrio es obligatorio");
        }
        if (esVacio(request.getDireccion())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La dirección es obligatoria");
        }

        Barrio barrio = barrioRepository.findById(request.getIdBarrio())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Barrio no encontrado"));

        return new DatosEntrega(
                request.getNombreReceptor().trim(),
                normalizarTelefono(request.getTelefonoReceptor()),
                request.getEmailReceptor().trim(),
                barrio,
                request.getDireccion().trim()
        );
    }

    // Precio con el descuento (porcentaje) del producto ya aplicado; sin descuento devuelve el precio tal cual.
    private static double precioFinal(Producto producto) {
        Double descuento = producto.getDescuento();
        if (descuento == null || descuento <= 0) {
            return producto.getPrecio();
        }
        return producto.getPrecio() * (1 - descuento / 100);
    }

    // Null si no vino codigo. Si vino, valida que exista, sea de la misma tienda, este vigente
    // y no se haya usado todavia; si no cumple algo, tira error en vez de ignorarlo en silencio.
    private Cupon resolverCupon(String codigoCupon, Tienda tienda) {
        if (codigoCupon == null || codigoCupon.isBlank()) {
            return null;
        }

        Cupon cupon = cuponRepository.findByCodigoIgnoreCase(codigoCupon.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cupón no encontrado"));

        if (!cupon.getTienda().getId().equals(tienda.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este cupón no es válido para esta tienda");
        }
        if (cupon.getPedido() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este cupón ya fue usado");
        }
        LocalDate hoy = LocalDate.now();
        if (hoy.isBefore(cupon.getFechaInicio()) || hoy.isAfter(cupon.getFechaFin())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este cupón no está vigente");
        }

        return cupon;
    }

    // Arma un texto libre a partir de una direccion estructurada, ej: "Mcal. Estigarribia, Casa 123".
    private static String formatearDireccion(Direccion direccion) {
        boolean hayEdificio = direccion.getNombreEdificio() != null && !direccion.getNombreEdificio().isBlank();
        if (hayEdificio) {
            return direccion.getCalle() + ", Edificio " + direccion.getNombreEdificio() + ", Depto " + direccion.getNroDepartamento();
        }
        return direccion.getCalle() + ", Casa " + direccion.getNroCasa();
    }

    private void cancelar(Pedido pedido) {
        if (pedido.getEstado() != EstadoPedido.PENDIENTE && pedido.getEstado() != EstadoPedido.CONFIRMADO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No se puede cancelar un pedido en estado " + pedido.getEstado().name().toLowerCase());
        }

        if (pedido.getEstado() == EstadoPedido.CONFIRMADO) {
            List<ProductoPedido> lineas = productoPedidoRepository.findByPedido_IdOrderByIdAsc(pedido.getId());
            for (ProductoPedido linea : lineas) {
                Producto producto = linea.getProducto();
                producto.setCantidadDisponible(producto.getCantidadDisponible() + linea.getCantidad());
                productoRepository.save(producto);
            }
        }

        pedido.setEstado(EstadoPedido.CANCELADO);
    }

    private void exigirEstado(Pedido pedido, EstadoPedido esperado, String accion) {
        if (pedido.getEstado() != esperado) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Solo se pueden " + accion + " pedidos en estado " + esperado.name().toLowerCase());
        }
    }

    private Pedido buscarDeTienda(Long idTienda, Long id) {
        return pedidoRepository.findByIdAndTienda_Id(id, idTienda)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));
    }

    private PagedResult<List<PedidoResponseDto>> paginar(Page<Pedido> resultado, int page, int perPage) {
        List<PedidoResponseDto> data = resultado.getContent().stream()
                .map(this::toResponse)
                .toList();
        return new PagedResult<>(data, page, perPage, (int) resultado.getTotalElements());
    }

    private void enviarCorreoConfirmacion(Pedido pedido, List<ProductoPedido> lineas) {
        StringBuilder detalle = new StringBuilder();
        lineas.forEach(linea -> detalle.append("- ")
                .append(linea.getProducto().getNombre())
                .append(" x")
                .append(linea.getCantidad())
                .append(": Gs. ")
                .append(String.format("%,.0f", linea.getTotal()))
                .append("\n"));

        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(remitente);
        mensaje.setTo(pedido.getEmailReceptor());
        mensaje.setSubject("Confirmación de tu pedido #" + pedido.getId() + " en SABA");
        mensaje.setText(
                "Hola " + pedido.getNombreReceptor() + ",\n\n"
                        + "Recibimos tu pedido #" + pedido.getId() + " en " + pedido.getTienda().getNombre() + ":\n\n"
                        + detalle
                        + "\nTotal: Gs. " + String.format("%,.0f", pedido.getTotal()) + "\n\n"
                        + "Se va a entregar en: " + pedido.getDireccion() + "\n\n"
                        + "Guardá este correo como comprobante de tu pedido."
        );

        try {
            mailSender.send(mensaje);
        } catch (MailException e) {
            log.error("No se pudo enviar el correo de confirmación del pedido {} a {}", pedido.getId(), pedido.getEmailReceptor(), e);
        }
    }

    private static boolean esVacio(String valor) {
        return valor == null || valor.isBlank();
    }

    // Convierte 0981123456 en 595981123456 (formato internacional sin +).
    private static String normalizarTelefono(String telefono) {
        return "595" + telefono.trim().substring(1);
    }

    private Usuario usuarioAutenticado() {
        String nombreUsuario = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByUsuarioIgnoreCase(nombreUsuario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
    }

    // Null si no hay sesion (invitado), a diferencia de usuarioAutenticado() que exige una.
    private Usuario usuarioAutenticadoOpcional() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return usuarioRepository.findByUsuarioIgnoreCase(auth.getName()).orElse(null);
    }

    private PedidoResponseDto toResponse(Pedido pedido) {
        List<ProductoPedido> lineas = productoPedidoRepository.findByPedido_IdOrderByIdAsc(pedido.getId());
        List<ProductoPedidoResponseDto> items = lineas.stream()
                .map(linea -> new ProductoPedidoResponseDto(
                        linea.getProducto().getId(),
                        linea.getProducto().getNombre(),
                        linea.getCantidad(),
                        linea.getPrecioUnitario(),
                        linea.getTotal()
                ))
                .toList();

        return new PedidoResponseDto(
                pedido.getId(),
                pedido.getTienda().getId(),
                pedido.getTienda().getNombre(),
                pedido.getUsuario() == null ? null : pedido.getUsuario().getId(),
                pedido.getNombreReceptor(),
                pedido.getTelefonoReceptor(),
                pedido.getEmailReceptor(),
                pedido.getBarrio().getId(),
                pedido.getBarrio().getNombre(),
                pedido.getDireccion(),
                pedido.getReferencia(),
                pedido.getTotal(),
                pedido.getEstado().name(),
                pedido.getFechaPedido(),
                pedido.getFechaEntrega(),
                items
        );
    }
}
