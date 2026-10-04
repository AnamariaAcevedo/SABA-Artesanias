package com.marketplace.marketplace_backend.modules.solicitudvendedor;

import com.marketplace.marketplace_backend.common.PagedResult;
import com.marketplace.marketplace_backend.modules.barrio.Barrio;
import com.marketplace.marketplace_backend.modules.barrio.BarrioRepository;
import com.marketplace.marketplace_backend.modules.contacto.Contacto;
import com.marketplace.marketplace_backend.modules.contacto.ContactoRepository;
import com.marketplace.marketplace_backend.modules.direccion.Direccion;
import com.marketplace.marketplace_backend.modules.direccion.DireccionRepository;
import com.marketplace.marketplace_backend.modules.rol.Rol;
import com.marketplace.marketplace_backend.modules.rol.RolRepository;
import com.marketplace.marketplace_backend.modules.solicitudvendedor.dto.SolicitudVendedorRequestDto;
import com.marketplace.marketplace_backend.modules.solicitudvendedor.dto.SolicitudVendedorResponseDto;
import com.marketplace.marketplace_backend.modules.tienda.Tienda;
import com.marketplace.marketplace_backend.modules.tienda.TiendaRepository;
import com.marketplace.marketplace_backend.modules.tipocontacto.TipoContacto;
import com.marketplace.marketplace_backend.modules.tipocontacto.TipoContactoRepository;
import com.marketplace.marketplace_backend.modules.tiendausuario.TiendaUsuario;
import com.marketplace.marketplace_backend.modules.tiendausuario.TiendaUsuarioRepository;
import com.marketplace.marketplace_backend.modules.tiendausuario.TipoVinculoTienda;
import com.marketplace.marketplace_backend.modules.usuario.Usuario;
import com.marketplace.marketplace_backend.modules.usuario.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@Service
// Implementación de las solicitudes para ser vendedor. Al aceptar se crea la tienda, su dirección,
// el vínculo PRINCIPAL, el contacto de WhatsApp y se asigna el rol VendedorPrincipal, todo en una transacción.
public class SolicitudVendedorServiceImpl implements SolicitudVendedorService {

    private static final String ROL_VENDEDOR_PRINCIPAL = "VendedorPrincipal";
    private static final String TIPO_CONTACTO_WHATSAPP = "WhatsApp";

    private final SolicitudVendedorRepository solicitudRepository;
    private final UsuarioRepository usuarioRepository;
    private final BarrioRepository barrioRepository;
    private final DireccionRepository direccionRepository;
    private final TiendaRepository tiendaRepository;
    private final TiendaUsuarioRepository tiendaUsuarioRepository;
    private final ContactoRepository contactoRepository;
    private final TipoContactoRepository tipoContactoRepository;
    private final RolRepository rolRepository;

    @Override
    @Transactional
    public SolicitudVendedorResponseDto crear(SolicitudVendedorRequestDto request) {
        Usuario usuario = usuarioAutenticado();

        if (tiendaUsuarioRepository.existsByUsuario_Id(usuario.getId())) {
            throw new IllegalStateException("Ya tenés una tienda asociada");
        }
        if (solicitudRepository.existsByUsuario_IdAndEstado(usuario.getId(), EstadoSolicitudVendedor.PENDIENTE)) {
            throw new IllegalStateException("Ya tenés una solicitud pendiente");
        }

        boolean hayEdificio = request.getNombreEdificio() != null && !request.getNombreEdificio().isBlank();
        if (!hayEdificio && request.getNroCasa() == null) {
            throw new IllegalArgumentException("El número de casa es obligatorio si no se indica un edificio");
        }
        if (hayEdificio && (request.getNroDepartamento() == null || request.getNroDepartamento().isBlank())) {
            throw new IllegalArgumentException("El número de departamento es obligatorio si se indica un edificio");
        }

        Barrio barrio = barrioRepository.findById(request.getIdBarrio())
                .orElseThrow(() -> new EntityNotFoundException("Barrio no encontrado"));

        SolicitudVendedor solicitud = new SolicitudVendedor();
        solicitud.setUsuario(usuario);
        solicitud.setNombreTienda(request.getNombreTienda().trim());
        solicitud.setDescripcionTienda(request.getDescripcionTienda().trim());
        solicitud.setCalle(request.getCalle().trim());
        solicitud.setNombreEdificio(hayEdificio ? request.getNombreEdificio().trim() : null);
        solicitud.setNroCasa(hayEdificio ? null : request.getNroCasa());
        solicitud.setNroDepartamento(hayEdificio ? request.getNroDepartamento().trim() : null);
        solicitud.setBarrio(barrio);
        solicitud.setTelefono(normalizarTelefono(request.getTelefono()));
        solicitud.setEstado(EstadoSolicitudVendedor.PENDIENTE);

        return toResponse(solicitudRepository.save(solicitud));
    }

    @Override
    @Transactional(readOnly = true)
    public SolicitudVendedorResponseDto obtenerMia() {
        Usuario usuario = usuarioAutenticado();
        return solicitudRepository.findFirstByUsuario_IdOrderByIdDesc(usuario.getId())
                .map(this::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("No tenés ninguna solicitud"));
    }

    @Override
    @Transactional
    public void eliminarMia() {
        Usuario usuario = usuarioAutenticado();
        SolicitudVendedor pendiente = solicitudRepository
                .findFirstByUsuario_IdAndEstado(usuario.getId(), EstadoSolicitudVendedor.PENDIENTE)
                .orElseThrow(() -> new EntityNotFoundException("No tenés una solicitud pendiente"));

        pendiente.setDeletedAt(LocalDateTime.now());
        solicitudRepository.save(pendiente);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResult<List<SolicitudVendedorResponseDto>> listar(String estado, int page, int perPage) {
        PageRequest pageable = PageRequest.of(Math.max(page, 1) - 1, Math.max(perPage, 1));

        Page<SolicitudVendedor> resultado = (estado == null || estado.isBlank())
                ? solicitudRepository.findAllByOrderByIdDesc(pageable)
                : solicitudRepository.findByEstado(EstadoSolicitudVendedor.valueOf(estado.trim().toUpperCase()), pageable);

        List<SolicitudVendedorResponseDto> data = resultado.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PagedResult<>(data, page, perPage, (int) resultado.getTotalElements());
    }

    @Override
    @Transactional
    public SolicitudVendedorResponseDto aceptar(Long id) {
        SolicitudVendedor solicitud = buscarSolicitud(id);
        exigirPendiente(solicitud);

        Usuario usuario = solicitud.getUsuario();
        if (tiendaUsuarioRepository.existsByUsuario_Id(usuario.getId())) {
            throw new IllegalStateException("El usuario ya tiene una tienda asociada");
        }

        Direccion direccion = new Direccion();
        direccion.setCalle(solicitud.getCalle());
        direccion.setNombreEdificio(solicitud.getNombreEdificio());
        direccion.setNroCasa(solicitud.getNroCasa());
        direccion.setNroDepartamento(solicitud.getNroDepartamento());
        direccion.setBarrio(solicitud.getBarrio());
        Direccion direccionGuardada = direccionRepository.save(direccion);

        Tienda tienda = new Tienda();
        tienda.setNombre(solicitud.getNombreTienda());
        tienda.setDescripcion(solicitud.getDescripcionTienda());
        tienda.setDireccion(direccionGuardada);
        Tienda tiendaGuardada = tiendaRepository.save(tienda);

        TiendaUsuario vinculo = new TiendaUsuario();
        vinculo.setTienda(tiendaGuardada);
        vinculo.setUsuario(usuario);
        vinculo.setTipo(TipoVinculoTienda.PRINCIPAL);
        tiendaUsuarioRepository.save(vinculo);

        TipoContacto whatsapp = tipoContactoRepository.findByNombreIgnoreCaseAndDeletedAtIsNull(TIPO_CONTACTO_WHATSAPP)
                .orElseThrow(() -> new EntityNotFoundException("Falta el tipo de contacto " + TIPO_CONTACTO_WHATSAPP));

        Contacto contacto = new Contacto();
        contacto.setEnlace("https://wa.me/" + solicitud.getTelefono());
        contacto.setUsuario(usuario.getUsuario());
        contacto.setNroTelefono(solicitud.getTelefono());
        contacto.setTipoContacto(whatsapp);
        contacto.setTienda(tiendaGuardada);
        contactoRepository.save(contacto);

        Rol rolVendedor = rolRepository.findByNombreAndDeletedAtIsNull(ROL_VENDEDOR_PRINCIPAL)
                .orElseThrow(() -> new EntityNotFoundException("Rol no encontrado: " + ROL_VENDEDOR_PRINCIPAL));
        usuario.setRol(rolVendedor);
        usuarioRepository.save(usuario);

        solicitud.setEstado(EstadoSolicitudVendedor.ACEPTADA);
        return toResponse(solicitudRepository.save(solicitud));
    }

    @Override
    @Transactional
    public SolicitudVendedorResponseDto rechazar(Long id, String motivo) {
        SolicitudVendedor solicitud = buscarSolicitud(id);
        exigirPendiente(solicitud);

        solicitud.setEstado(EstadoSolicitudVendedor.RECHAZADA);
        solicitud.setMotivoRechazo(motivo.trim());
        return toResponse(solicitudRepository.save(solicitud));
    }

    private SolicitudVendedor buscarSolicitud(Long id) {
        return solicitudRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Solicitud no encontrada con ID: " + id));
    }

    private void exigirPendiente(SolicitudVendedor solicitud) {
        if (solicitud.getEstado() != EstadoSolicitudVendedor.PENDIENTE) {
            throw new IllegalStateException("La solicitud ya fue " + solicitud.getEstado().name().toLowerCase());
        }
    }

    // Convierte 0981123456 en 595981123456 (formato internacional sin +).
    private static String normalizarTelefono(String telefono) {
        return "595" + telefono.trim().substring(1);
    }

    private Usuario usuarioAutenticado() {
        String nombreUsuario = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByUsuarioIgnoreCase(nombreUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado: " + nombreUsuario));
    }

    private SolicitudVendedorResponseDto toResponse(SolicitudVendedor solicitud) {
        Usuario usuario = solicitud.getUsuario();
        return new SolicitudVendedorResponseDto(
                solicitud.getId(),
                solicitud.getEstado().name(),
                solicitud.getMotivoRechazo(),
                usuario.getId(),
                usuario.getUsuario(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getEmail(),
                solicitud.getNombreTienda(),
                solicitud.getDescripcionTienda(),
                solicitud.getCalle(),
                solicitud.getNombreEdificio(),
                solicitud.getNroCasa(),
                solicitud.getNroDepartamento(),
                solicitud.getBarrio().getId(),
                solicitud.getBarrio().getNombre(),
                solicitud.getTelefono(),
                solicitud.getCreatedAt()
        );
    }
}
